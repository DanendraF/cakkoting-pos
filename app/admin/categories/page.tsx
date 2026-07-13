'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, getMenu } from '@/lib/menu';
import type { Category, MenuItem } from '@/lib/types';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  FileBarChart,
  LogOut,
  X,
  Check,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

const AUTH_KEY = 'cakkoting_admin_auth';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Kategori', href: '/admin/categories', icon: Tags },
  { label: 'Laporan', href: '/admin/reports', icon: FileBarChart },
];

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  // Inline "Tambah Kategori" form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');

  // Inline rename state
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // --- Auth guard ---
  useEffect(() => {
    try {
      const ok = sessionStorage.getItem(AUTH_KEY) === 'true';
      setAuthed(ok);
      if (!ok) {
        router.replace('/admin/login');
      }
    } catch {
      setAuthed(false);
      router.replace('/admin/login');
    }
  }, [router]);

  // --- Load data once authed ---
  useEffect(() => {
    if (!authed) return;
    setCategories(getCategories());
    setMenu(getMenu());
  }, [authed]);

  // Count items per category name
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of menu) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [menu]);

  // --- Add category ---
  const handleAdd = () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (
      categories.some(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      toast.error('Kategori dengan nama tersebut sudah ada');
      return;
    }
    const nextOrder =
      categories.length === 0
        ? 1
        : Math.max(...categories.map((c) => c.displayOrder)) + 1;
    setCategories((prev) => [
      ...prev,
      { name, displayOrder: nextOrder },
    ]);
    setNewName('');
    setShowAddForm(false);
    toast.success(`Kategori "${name}" ditambahkan`);
  };

  const cancelAdd = () => {
    setNewName('');
    setShowAddForm(false);
  };

  // --- Rename (inline) ---
  const startRename = (cat: Category) => {
    setEditingName(cat.name);
    setEditValue(cat.name);
  };

  const cancelRename = () => {
    setEditingName(null);
    setEditValue('');
  };

  const saveRename = (originalName: string) => {
    const name = editValue.trim();
    if (!name) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (name === originalName) {
      cancelRename();
      return;
    }
    if (
      categories.some(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      toast.error('Kategori dengan nama tersebut sudah ada');
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.name === originalName ? { ...c, name } : c
      )
    );
    // Keep menu items in sync (their category field references the name)
    setMenu((prev) =>
      prev.map((m) =>
        m.category === originalName ? { ...m, category: name } : m
      )
    );
    setEditingName(null);
    setEditValue('');
    toast.success(`Kategori diubah menjadi "${name}"`);
  };

  // --- Reorder (up/down) ---
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    setCategories((prev) => {
      const next = [...prev];
      const a = next[index].displayOrder;
      next[index] = { ...next[index], displayOrder: next[target].displayOrder };
      next[target] = { ...next[target], displayOrder: a };
      return [...next].sort(
        (x, y) => x.displayOrder - y.displayOrder
      );
    });
  };

  // --- Delete ---
  const requestDelete = (cat: Category) => {
    const count = itemCounts[cat.name] ?? 0;
    if (count > 0) {
      toast.warning(
        `Tidak dapat menghapus "${cat.name}" karena masih memiliki ${count} item menu. Pindahkan atau hapus item terlebih dahulu.`
      );
      return;
    }
    setDeleteTarget(cat);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    setCategories((prev) => prev.filter((c) => c.name !== name));
    setDeleteTarget(null);
    toast.success(`Kategori "${name}" dihapus`);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    router.replace('/admin/login');
  };

  // --- Sidebar nav ---
  const renderNav = () => (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/admin/categories';
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
              isActive
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-text-muted hover:bg-black/5 hover:text-text-main'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  // Loading / redirecting
  if (authed === null || authed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-text-muted text-sm">Memuat…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex">
      <Toaster position="top-center" richColors />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-bg-card border-r border-black/5 h-screen sticky top-0">
        <div className="px-6 py-6 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-text-main text-sm">Cak Koting</p>
              <p className="text-[11px] text-text-muted">Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto">{renderNav()}</div>

        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-bg-card border-b border-black/5">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-text-main text-sm">Admin Panel</span>
          </div>
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="p-2 -mr-2 rounded-lg hover:bg-black/5 text-text-main"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileNavOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {mobileNavOpen && (
          <div className="px-3 pb-3 border-t border-black/5 bg-bg-card">
            <div className="pt-3">{renderNav()}</div>
            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="px-4 sm:px-6 lg:px-8 pt-14 md:pt-8 pb-12">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-main tracking-tight">
                Manajemen Kategori
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Kelola kategori menu dan urutan tampilnya
              </p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori
              </button>
            )}
          </div>

          {/* List card */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Inline add form (top of list) */}
            {showAddForm && (
              <div className="px-5 py-4 border-b border-border bg-primary/5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Nama Kategori
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd();
                        if (e.key === 'Escape') cancelAdd();
                      }}
                      placeholder="cth. Minuman Dingin"
                      className="w-full h-11 px-4 rounded-lg border border-input bg-white text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:mt-6">
                    <button
                      onClick={handleAdd}
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Simpan
                    </button>
                    <button
                      onClick={cancelAdd}
                      className="inline-flex items-center gap-1.5 bg-white border border-border text-text-muted hover:text-text-main hover:bg-accent font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[2.5rem_1fr_auto_6rem_7rem] gap-3 px-5 py-3 border-b border-border bg-bg-light/60 text-xs font-medium text-text-muted uppercase tracking-wider">
              <div className="text-center">Urut</div>
              <div>Nama Kategori</div>
              <div className="text-center">Item</div>
              <div></div>
              <div className="text-right">Aksi</div>
            </div>

            {/* Rows */}
            {categories.length === 0 && !showAddForm ? (
              <div className="px-5 py-12 text-center">
                <Tags className="w-10 h-10 text-text-muted/40 mx-auto mb-3" />
                <p className="text-text-muted text-sm">
                  Belum ada kategori. Klik &quot;Tambah Kategori&quot; untuk membuat.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {categories.map((cat, index) => {
                  const count = itemCounts[cat.name] ?? 0;
                  const isEditing = editingName === cat.name;
                  const isFirst = index === 0;
                  const isLast = index === categories.length - 1;

                  return (
                    <div
                      key={cat.name}
                      className="md:grid md:grid-cols-[2.5rem_1fr_auto_6rem_7rem] md:gap-3 md:items-center px-5 py-3.5 hover:bg-bg-light/70 transition-colors"
                    >
                      {/* Up/Down controls */}
                      <div className="flex md:justify-center items-center gap-1 mb-2 md:mb-0">
                        <button
                          onClick={() => move(index, -1)}
                          disabled={isFirst}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-muted hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-text-muted disabled:hover:border-border"
                          aria-label={`Pindahkan ${cat.name} ke atas`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => move(index, 1)}
                          disabled={isLast}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-muted hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-text-muted disabled:hover:border-border"
                          aria-label={`Pindahkan ${cat.name} ke bawah`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Name (or inline edit input) */}
                      <div className="min-w-0">
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename(cat.name);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-white text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-main">
                              {cat.name}
                            </span>
                            <span className="text-xs text-text-muted hidden sm:inline">
                              · urutan {cat.displayOrder}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Item count badge */}
                      <div className="flex md:justify-center items-center mt-2 md:mt-0">
                        <span
                          className={`inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-full text-xs font-semibold ${
                            count > 0
                              ? 'bg-primary/15 text-primary'
                              : 'bg-accent text-text-muted'
                          }`}
                        >
                          {count}
                        </span>
                      </div>

                      {/* Spacer for edit actions on desktop */}
                      <div className="hidden md:block">
                        {isEditing && (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => saveRename(cat.name)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
                              aria-label="Simpan nama"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelRename}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-accent hover:text-text-main transition-colors"
                              aria-label="Batal ubah nama"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 mt-2 md:mt-0">
                        {isEditing ? (
                          /* Mobile edit actions (visible only on small screens) */
                          <>
                            <button
                              onClick={() => saveRename(cat.name)}
                              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
                              aria-label="Simpan nama"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelRename}
                              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-accent hover:text-text-main transition-colors"
                              aria-label="Batal ubah nama"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startRename(cat)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                              aria-label={`Ubah nama ${cat.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => requestDelete(cat)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                              aria-label={`Hapus ${cat.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Helper note */}
          <p className="text-xs text-text-muted mt-4 px-1">
            Kategori dengan tanda kuning memiliki item menu. Kategori yang masih
            memiliki item tidak dapat dihapus.
          </p>
        </div>
      </main>

      {/* Delete confirmation dialog (lightweight, no external Dialog dep) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-xl border border-border shadow-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-text-main">
                  Hapus kategori ini?
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  Anda akan menghapus{' '}
                  <span className="font-semibold text-text-main">
                    {deleteTarget.name}
                  </span>
                  . Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="inline-flex items-center gap-1.5 bg-white border border-border text-text-muted hover:text-text-main hover:bg-accent font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
