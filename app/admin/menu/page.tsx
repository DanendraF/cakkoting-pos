'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMenu, getCategories } from '@/lib/menu';
import { formatRupiah } from '@/lib/format';
import type { MenuItem, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  FileBarChart,
  LogOut,
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

export default function AdminMenuPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  // Auth guard
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

  // Load data
  useEffect(() => {
    if (authed) {
      setMenu(getMenu());
      setCategories(getCategories());
    }
  }, [authed]);

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menu;
    return menu.filter((m) => m.name.toLowerCase().includes(q));
  }, [menu, search]);

  // Group filtered menu by category, preserving category order
  const grouped = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        items: filteredMenu.filter((m) => m.category === cat.name),
      }))
      .filter((g) => g.items.length > 0);
  }, [categories, filteredMenu]);

  const hasResults = grouped.length > 0;

  const handleToggle = (id: string) => {
    setMenu((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isAvailable: !m.isAvailable } : m
      )
    );
    const item = menu.find((m) => m.id === id);
    if (item) {
      toast.success(
        `${item.name} ${item.isAvailable ? ' disembunyikan' : ' ditampilkan'}`
      );
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/menu/${id}`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setMenu((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.name}" telah dihapus`);
    setDeleteTarget(null);
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
        const isActive = item.href === '/admin/menu';
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

  // Loading / redirecting state
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
                Manajemen Menu
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Kelola daftar menu, harga, dan ketersediaan
              </p>
            </div>
            <Button
              onClick={() => toast.info('Form tambah menu segera hadir')}
              className="bg-primary text-primary-foreground hover:bg-primary-hover shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Menu
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu berdasarkan nama…"
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-white text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Content */}
          {hasResults ? (
            <div className="space-y-6">
              {/* Desktop: table per category group */}
              <div className="hidden md:block space-y-6">
                {grouped.map(({ category, items }) => (
                  <section
                    key={category.name}
                    className="bg-white rounded-xl border border-border overflow-hidden"
                  >
                    <div className="px-5 py-3.5 border-b border-border bg-bg-light/60">
                      <h2 className="font-semibold text-text-main">
                        {category.name}
                        <span className="ml-2 text-sm font-normal text-text-muted">
                          ({items.length} item)
                        </span>
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-text-muted">
                            <th className="px-5 py-3 font-medium w-[45%]">Nama</th>
                            <th className="px-5 py-3 font-medium w-[20%]">Harga Dasar</th>
                            <th className="px-5 py-3 font-medium w-[20%]">Status</th>
                            <th className="px-5 py-3 font-medium text-right w-[15%]">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-border last:border-0 hover:bg-bg-light/70 transition-colors"
                            >
                              <td className="px-5 py-3">
                                <div className="font-medium text-text-main">
                                  {item.name}
                                </div>
                                {item.desc && (
                                  <div className="text-xs text-text-muted line-clamp-1 mt-0.5">
                                    {item.desc}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-3 text-text-main whitespace-nowrap">
                                {formatRupiah(item.price)}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={item.isAvailable}
                                    onCheckedChange={() => handleToggle(item.id)}
                                    aria-label={`Toggle ketersediaan ${item.name}`}
                                  />
                                  <span
                                    className={`text-xs font-medium ${
                                      item.isAvailable
                                        ? 'text-success'
                                        : 'text-text-muted'
                                    }`}
                                  >
                                    {item.isAvailable ? 'Tersedia' : 'Disembunyikan'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEdit(item.id)}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                                    aria-label={`Edit ${item.name}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(item)}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                    aria-label={`Hapus ${item.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>

              {/* Mobile: stacked cards per category */}
              <div className="md:hidden space-y-6">
                {grouped.map(({ category, items }) => (
                  <section key={category.name}>
                    <h2 className="font-semibold text-text-main mb-3 px-1">
                      {category.name}
                      <span className="ml-2 text-sm font-normal text-text-muted">
                        ({items.length})
                      </span>
                    </h2>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-border p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-text-main">
                                {item.name}
                              </div>
                              {item.desc && (
                                <div className="text-xs text-text-muted line-clamp-2 mt-0.5">
                                  {item.desc}
                                </div>
                              )}
                              <div className="text-sm font-semibold text-text-main mt-1.5">
                                {formatRupiah(item.price)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleEdit(item.id)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                aria-label={`Hapus ${item.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <span
                              className={`text-xs font-medium ${
                                item.isAvailable
                                  ? 'text-success'
                                  : 'text-text-muted'
                              }`}
                            >
                              {item.isAvailable
                                ? 'Tersedia'
                                : 'Disembunyikan'}
                            </span>
                            <Switch
                              checked={item.isAvailable}
                              onCheckedChange={() => handleToggle(item.id)}
                              aria-label={`Toggle ketersediaan ${item.name}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <Search className="w-10 h-10 text-text-muted/40 mx-auto mb-3" />
              <p className="text-text-muted text-sm">
                Menu tidak ditemukan, coba kata kunci lain
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus menu ini?</DialogTitle>
            <DialogDescription>
              Anda akan menghapus{' '}
              <span className="font-semibold text-text-main">
                {deleteTarget?.name}
              </span>
              . Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-secondary text-secondary-foreground hover:bg-secondary-hover"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
