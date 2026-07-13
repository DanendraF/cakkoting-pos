'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMenuItem, getCategories } from '@/lib/menu';
import { formatRupiah } from '@/lib/format';
import type { MenuItem, Category, MenuOptionGroup, MenuOption } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  FileBarChart,
  LogOut,
  GripVertical,
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

// Local working copies of the option group/option shapes (with stable local ids)
interface LocalOption extends MenuOption {
  _localId: string;
}

interface LocalOptionGroup {
  _localId: string;
  name: string;
  required: boolean;
  allowMultiple: boolean;
  options: LocalOption[];
}

let _localIdCounter = 0;
const nextLocalId = () => `local-${++_localIdCounter}`;

function toLocalGroup(g: MenuOptionGroup): LocalOptionGroup {
  return {
    _localId: nextLocalId(),
    name: g.name,
    required: g.required,
    allowMultiple: g.allowMultiple,
    options: g.options.map((o) => ({ ...o, _localId: nextLocalId() })),
  };
}

export default function AdminEditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? '');

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [item, setItem] = useState<MenuItem | null | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [groups, setGroups] = useState<LocalOptionGroup[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);

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

  // Load data once authed
  useEffect(() => {
    if (!authed) return;
    const cats = getCategories();
    setCategories(cats);
    const found = getMenuItem(id);
    if (found) {
      setItem(found);
      setName(found.name);
      setCategory(found.category);
      setDesc(found.desc ?? '');
      setPrice(String(found.price));
      setImage(found.image ?? '');
      setGroups(found.groups.map(toLocalGroup));
    } else {
      setItem(null);
    }
  }, [authed, id]);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    router.replace('/admin/login');
  };

  // --- Option group handlers ---
  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        _localId: nextLocalId(),
        name: '',
        required: false,
        allowMultiple: false,
        options: [{ _localId: nextLocalId(), name: '', priceAdjustment: 0 }],
      },
    ]);
  };

  const removeGroup = (localId: string) => {
    setGroups((prev) => prev.filter((g) => g._localId !== localId));
  };

  const updateGroup = (localId: string, patch: Partial<LocalOptionGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g._localId === localId ? { ...g, ...patch } : g))
    );
  };

  const addOption = (groupLocalId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g._localId === groupLocalId
          ? {
              ...g,
              options: [
                ...g.options,
                { _localId: nextLocalId(), name: '', priceAdjustment: 0 },
              ],
            }
          : g
      )
    );
  };

  const removeOption = (groupLocalId: string, optionLocalId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g._localId === groupLocalId
          ? {
              ...g,
              options: g.options.filter((o) => o._localId !== optionLocalId),
            }
          : g
      )
    );
  };

  const updateOption = (
    groupLocalId: string,
    optionLocalId: string,
    patch: Partial<LocalOption>
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g._localId === groupLocalId
          ? {
              ...g,
              options: g.options.map((o) =>
                o._localId === optionLocalId ? { ...o, ...patch } : o
              ),
            }
          : g
      )
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nama menu tidak boleh kosong');
      return;
    }
    if (!category.trim()) {
      toast.error('Pilih kategori terlebih dahulu');
      return;
    }
    toast.success('Perubahan menu berhasil disimpan');
  };

  const confirmDelete = () => {
    setDeleteOpen(false);
    toast.success(`"${item?.name ?? 'Menu'}" telah dihapus`);
    router.push('/admin/menu');
  };

  // Loading / redirecting state
  if (authed === null || authed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-text-muted text-sm">Memuat…</p>
      </div>
    );
  }

  // Not found
  if (item === null) {
    return (
      <div className="min-h-screen bg-bg-light flex">
        <Toaster position="top-center" richColors />
        <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-border">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <span className="font-bold text-text-main text-lg tracking-tight">
              Cak Koting
            </span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((navItem) => {
              const isActive = navItem.href === '/admin/menu';
              const Icon = navItem.icon;
              return (
                <a
                  key={navItem.href}
                  href={navItem.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-text-muted hover:bg-accent hover:text-text-main'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {navItem.label}
                </a>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-border">
            <div className="flex items-center gap-2 md:hidden">
              <UtensilsCrossed className="w-5 h-5 text-text-main" />
              <span className="font-bold text-text-main">Cak Koting</span>
            </div>
            <div className="hidden md:block" />
            <button
              onClick={handleLogout}
              className="md:hidden flex items-center gap-2 text-sm text-text-muted hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
            <div className="bg-white rounded-xl border border-border p-10 text-center max-w-md w-full">
              <UtensilsCrossed className="w-10 h-10 text-text-muted/40 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-text-main mb-1">
                Menu tidak ditemukan
              </h2>
              <p className="text-sm text-text-muted mb-5">
                Menu yang Anda cari mungkin telah dihapus atau ID tidak valid.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/menu')}
                className="border-border"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali ke Menu
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading item
  if (item === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-text-muted text-sm">Memuat menu…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex">
      <Toaster position="top-center" richColors />

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-border">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-bold text-text-main text-lg tracking-tight">
            Cak Koting
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((navItem) => {
            const isActive = navItem.href === '/admin/menu';
            const Icon = navItem.icon;
            return (
              <a
                key={navItem.href}
                href={navItem.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-text-muted hover:bg-accent hover:text-text-main'
                }`}
              >
                <Icon className="w-4 h-4" />
                {navItem.label}
              </a>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-border">
          <div className="flex items-center gap-2 md:hidden">
            <UtensilsCrossed className="w-5 h-5 text-text-main" />
            <span className="font-bold text-text-main">Cak Koting</span>
          </div>
          <div className="hidden md:block" />
          <button
            onClick={handleLogout}
            className="md:hidden flex items-center gap-2 text-sm text-text-muted hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto">
          {/* Back link */}
          <a
            href="/admin/menu"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Menu
          </a>

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-main tracking-tight">
              Edit Menu
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Perbarui detail menu, harga, dan grup opsi
            </p>
          </div>

          {/* Main form card */}
          <section className="bg-white rounded-xl border border-border p-5 sm:p-6 mb-6">
            <h2 className="text-base font-semibold text-text-main mb-4">
              Informasi Menu
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="menu-name"
                  className="block text-sm font-medium text-text-main mb-1.5"
                >
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <Input
                  id="menu-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Nasi Goreng Spesial"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="menu-category"
                  className="block text-sm font-medium text-text-main mb-1.5"
                >
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  id="menu-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>
                    Pilih kategori…
                  </option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base price */}
              <div>
                <label
                  htmlFor="menu-price"
                  className="block text-sm font-medium text-text-main mb-1.5"
                >
                  Harga Dasar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
                    Rp
                  </span>
                  <Input
                    id="menu-price"
                    type="number"
                    min={0}
                    step={500}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="pl-9"
                  />
                </div>
                {price && !Number.isNaN(Number(price)) && Number(price) > 0 && (
                  <p className="text-xs text-text-muted mt-1.5">
                    {formatRupiah(Number(price))}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="menu-desc"
                  className="block text-sm font-medium text-text-main mb-1.5"
                >
                  Deskripsi
                </label>
                <Textarea
                  id="menu-desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Deskripsi singkat menu…"
                  rows={3}
                />
              </div>

              {/* Image URL */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="menu-image"
                  className="block text-sm font-medium text-text-main mb-1.5"
                >
                  URL Gambar{' '}
                  <span className="text-text-muted font-normal">(opsional)</span>
                </label>
                <Input
                  id="menu-image"
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://…"
                />
                {image && (
                  <div className="mt-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          'none';
                      }}
                    />
                    <span className="text-xs text-text-muted">
                      Pratinjau gambar
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Option groups section */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-text-main">
                  Grup Opsi
                </h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Atur variasi seperti tingkat kepedasan, topping, atau ukuran
                </p>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <UtensilsCrossed className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
                <p className="text-sm text-text-muted mb-4">
                  Belum ada grup opsi untuk menu ini
                </p>
                <Button
                  onClick={addGroup}
                  variant="outline"
                  className="border-dashed border-primary text-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Grup Opsi
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group, gIdx) => (
                  <div
                    key={group._localId}
                    className="bg-white rounded-xl border border-border overflow-hidden"
                  >
                    {/* Group header */}
                    <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-border bg-bg-light/40">
                      <div className="hidden sm:flex items-center pt-2 text-text-muted/60">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          type="text"
                          value={group.name}
                          onChange={(e) =>
                            updateGroup(group._localId, { name: e.target.value })
                          }
                          placeholder={`Nama grup opsi (contoh: Level Pedas)`}
                          className="font-medium"
                        />
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Switch
                              checked={group.required}
                              onCheckedChange={(checked) =>
                                updateGroup(group._localId, {
                                  required: checked,
                                })
                              }
                              aria-label={`Grup ${gIdx + 1} wajib`}
                            />
                            <span className="text-sm text-text-main">
                              Wajib dipilih
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Switch
                              checked={group.allowMultiple}
                              onCheckedChange={(checked) =>
                                updateGroup(group._localId, {
                                  allowMultiple: checked,
                                })
                              }
                              aria-label={`Grup ${gIdx + 1} pilihan ganda`}
                            />
                            <span className="text-sm text-text-main">
                              Pilih lebih dari satu
                            </span>
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={() => removeGroup(group._localId)}
                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        aria-label="Hapus grup opsi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Options list */}
                    <div className="px-4 sm:px-5 py-4">
                      <div className="space-y-2.5">
                        {group.options.map((opt, oIdx) => (
                          <div
                            key={opt._localId}
                            className="flex items-center gap-2"
                          >
                            <span className="text-xs font-medium text-text-muted w-5 shrink-0 text-right">
                              {oIdx + 1}.
                            </span>
                            <Input
                              type="text"
                              value={opt.name}
                              onChange={(e) =>
                                updateOption(group._localId, opt._localId, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nama opsi (contoh: Pedas)"
                              className="flex-1"
                            />
                            <div className="relative w-32 sm:w-40 shrink-0">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                                Rp
                              </span>
                              <Input
                                type="number"
                                value={opt.priceAdjustment}
                                onChange={(e) =>
                                  updateOption(group._localId, opt._localId, {
                                    priceAdjustment: Number(e.target.value),
                                  })
                                }
                                placeholder="0"
                                className="pl-8"
                              />
                            </div>
                            <button
                              onClick={() =>
                                removeOption(group._localId, opt._localId)
                              }
                              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                              aria-label="Hapus opsi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => addOption(group._localId)}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Opsi
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add group (dashed) */}
                <button
                  onClick={addGroup}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border text-sm font-medium text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Grup Opsi
                </button>
              </div>
            )}
          </section>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              <Save className="w-4 h-4 mr-1" />
              Simpan Perubahan
            </Button>
            <Button
              onClick={() => setDeleteOpen(true)}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Hapus Menu
            </Button>
          </div>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus menu ini?</DialogTitle>
            <DialogDescription>
              Anda akan menghapus{' '}
              <span className="font-semibold text-text-main">
                {item?.name}
              </span>
              . Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
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
