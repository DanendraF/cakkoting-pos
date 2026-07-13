'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useMenu, getMinPrice, hasVariants, type ApiMenuItem } from '@/lib/hooks/useMenu';
import { fetchMenuRecommendations, type ApiMenuItem as ApiMenuItemRec } from '@/lib/api-client';
import { formatRupiah } from '@/lib/format';
import type { CartItemOption } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Minus, Plus, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { totalItems, totalPrice, setTableId, tableId } = useCart();
  const { grouped, loading: menuLoading, error: menuError } = useMenu();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<ApiMenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const meja = searchParams.get('meja');

  useEffect(() => {
    if (!meja) {
      router.replace('/table-invalid');
      return;
    }
    setTableId(meja);
  }, [meja, router, setTableId]);

  useEffect(() => {
    if (!activeCategory && grouped.length > 0 && grouped[0]) {
      setActiveCategory(grouped[0].category.name);
    }
  }, [activeCategory, grouped]);

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    const el = sectionRefs.current[categoryName];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMenuClick = (menu: ApiMenuItem) => {
    if (!menu.isAvailable) return;
    setSelectedMenu(menu);
    setSheetOpen(true);
  };

  if (menuLoading) {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-text-muted">Memuat menu…</p>
      </div>
    );
  }

  if (menuError) {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-main font-semibold">Gagal memuat menu</p>
        <p className="text-xs text-text-muted">{menuError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-xl bg-primary text-sm font-semibold text-text-main"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light pb-24">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 safe-top">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-text-main">
              CK
            </div>
            <div>
              <p className="font-bold text-sm text-text-main leading-tight">
                Cak Koting
              </p>
              <p className="text-xs text-text-muted leading-tight">
                Bebek Goreng
              </p>
            </div>
          </div>
          {meja && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
              <span className="text-xs font-semibold text-text-main">
                Meja {meja}
              </span>
            </div>
          )}
        </div>
        {/* Category tabs */}
        <div className="max-w-3xl mx-auto px-4 md:px-12 pb-2">
          <Carousel
            opts={{
              align: 'start',
              dragFree: true,
            }}
            className="w-full relative"
          >
            <CarouselContent className="-ml-2">
              {grouped.map(({ category }) => (
                <CarouselItem key={category.name} className="pl-2 basis-auto">
                  <button
                    onClick={() => handleCategoryClick(category.name)}
                    className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all tap-target ${
                      activeCategory === category.name
                        ? 'bg-primary text-text-main'
                        : 'bg-gray-100 text-text-muted'
                    }`}
                  >
                    {category.name}
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-white" />
            <CarouselNext className="hidden md:flex -right-12 bg-white" />
          </Carousel>
        </div>
      </header>

      {/* Menu sections */}
      <main className="max-w-3xl mx-auto px-4 pt-4">
        {grouped.map(({ category, items }) => (
          <div
            key={category.name}
            ref={(el) => {
              sectionRefs.current[category.name] = el;
            }}
            className="mb-6 scroll-mt-32"
          >
            <h2 className="text-lg font-bold text-text-main mb-3">
              {category.name}
            </h2>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted">
                  Menu di kategori ini belum tersedia
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <MenuCard key={item.id} item={item} onClick={() => handleMenuClick(item)} />
                ))}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Sticky Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg shadow-primary/30"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-text-main" />
                  <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <span className="font-semibold text-text-main text-sm">
                  {totalItems} Items
                </span>
              </div>
              <span className="font-bold text-text-main text-sm">
                {formatRupiah(totalPrice)} →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom-sheet variant selector (with upselling) */}
      <VariantSheet
        menu={selectedMenu}
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setSelectedMenu(null);
        }}
      />
    </div>
  );
}

// ─── MenuCard ─────────────────────────────────────────────────────────────────

function MenuCard({ item, onClick }: { item: ApiMenuItem; onClick: () => void }) {
  const minPrice = getMinPrice(item);
  const hasPriceVariants = item.groups.some((g) =>
    g.options.some((o) => o.priceAdjustment > 0)
  );

  return (
    <button
      onClick={onClick}
      disabled={!item.isAvailable}
      className={`w-full flex gap-3 p-3 rounded-2xl border transition-all text-left ${
        item.isAvailable
          ? 'bg-white border-gray-100 hover:border-primary/40 hover:shadow-sm active:scale-[0.99]'
          : 'bg-gray-50 border-gray-100 opacity-60'
      }`}
    >
      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl font-bold text-primary/40">
          {item.name.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-text-main leading-tight">
            {item.name}
          </h3>
          {item.desc && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
              {item.desc}
            </p>
          )}
          {hasVariants(item) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.groups.map((g) => (
                <span
                  key={g.name}
                  className="text-[10px] bg-gray-100 text-text-muted px-1.5 py-0.5 rounded"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-sm text-secondary">
            {hasPriceVariants ? 'Mulai ' : ''}
            {formatRupiah(minPrice)}
          </span>
          {!item.isAvailable && (
            <Badge variant="secondary" className="text-xs">
              Habis
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── VariantSheet (with Upselling) ───────────────────────────────────────────

function VariantSheet({
  menu,
  open,
  onOpenChange,
}: {
  menu: ApiMenuItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<ApiMenuItemRec[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (open && menu) {
      setQty(1);
      setNote('');
      setSelectedOptions({});
      setErrors([]);
      setShowUpsell(false);
      setRecommendations([]);
    }
  }, [open, menu]);

  // Fetch recommendations when sheet opens
  useEffect(() => {
    if (!open || !menu) return;
    setLoadingRec(true);
    fetchMenuRecommendations(menu.id)
      .then((res) => setRecommendations(res.recommendations))
      .catch(() => setRecommendations([]))
      .finally(() => setLoadingRec(false));
  }, [open, menu]);

  if (!menu) return null;

  const handleOptionChange = (groupName: string, optionName: string, allowMultiple: boolean) => {
    setSelectedOptions((prev) => {
      const current = prev[groupName] || [];
      if (allowMultiple) {
        return {
          ...prev,
          [groupName]: current.includes(optionName)
            ? current.filter((o) => o !== optionName)
            : [...current, optionName],
        };
      }
      return { ...prev, [groupName]: [optionName] };
    });
    setErrors([]);
  };

  const validate = (): boolean => {
    const missing: string[] = [];
    menu.groups.forEach((g) => {
      if (g.required && (selectedOptions[g.name] || []).length === 0) {
        missing.push(g.name);
      }
    });
    setErrors(missing);
    return missing.length === 0;
  };

  const computeTotal = (): number => {
    let total = menu.price;
    menu.groups.forEach((g) => {
      (selectedOptions[g.name] || []).forEach((optName) => {
        const opt = g.options.find((o) => o.name === optName);
        if (opt) total += opt.priceAdjustment;
      });
    });
    return total * qty;
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    const options: CartItemOption[] = [];
    menu.groups.forEach((g) => {
      (selectedOptions[g.name] || []).forEach((optName) => {
        const opt = g.options.find((o) => o.name === optName);
        if (opt) {
          options.push({
            groupName: g.name,
            optionName: opt.name,
            priceAdjustment: opt.priceAdjustment,
          });
        }
      });
    });

    // Build a MenuItem-compatible object from ApiMenuItem
    addItem(
      {
        id: menu.id,
        category: menu.category?.name ?? '',
        name: menu.name,
        price: menu.price,
        desc: menu.desc,
        isAvailable: menu.isAvailable,
        groups: menu.groups,
      },
      qty,
      options,
      note
    );

    // Show upsell panel if recommendations exist
    if (recommendations.length > 0) {
      setShowUpsell(true);
    } else {
      toast.success(`${menu.name} ditambahkan ke keranjang`);
      onOpenChange(false);
    }
  };

  const handleUpsellAdd = (rec: ApiMenuItemRec) => {
    // Add recommended item without variants (quick add, no options)
    if (rec.groups.length === 0) {
      addItem(
        {
          id: rec.id,
          category: rec.category?.name ?? '',
          name: rec.name,
          price: rec.price,
          desc: rec.desc,
          isAvailable: rec.isAvailable,
          groups: [],
        },
        1,
        [],
        ''
      );
      toast.success(`${rec.name} ditambahkan!`);
    } else {
      // Has variants — close this sheet and open new one for the recommended item
      onOpenChange(false);
      toast.success(`${menu.name} ditambahkan ke keranjang`);
    }
  };

  const handleUpsellDismiss = () => {
    toast.success(`${menu.name} ditambahkan ke keranjang`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl safe-bottom"
      >
        {/* ── Upsell Panel (shown after add to cart) ── */}
        {showUpsell ? (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-text-main">Cocok dengan {menu.name}</p>
                <p className="text-xs text-text-muted">Menu yang sering dipesan bersamaan</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {recommendations.map((rec) => {
                const recMinPrice = getMinPrice({
                  ...rec,
                  groups: rec.groups,
                });
                return (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary/40">
                        {rec.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-main truncate">{rec.name}</p>
                      <p className="text-xs text-secondary font-medium">
                        {rec.groups.length > 0 ? 'Mulai ' : ''}{formatRupiah(recMinPrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpsellAdd(rec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        rec.groups.length > 0
                          ? 'border border-primary text-primary'
                          : 'bg-primary text-text-main'
                      }`}
                    >
                      {rec.groups.length > 0 ? 'Pilih' : '+ Tambah'}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleUpsellDismiss}
              className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all rounded-xl py-3.5 font-bold text-sm text-text-main"
            >
              Tidak, terima kasih
            </button>
          </div>
        ) : (
          /* ── Normal Variant Sheet ── */
          <>
            <SheetHeader className="mb-4">
              <SheetTitle className="text-left text-lg font-bold">
                {menu.name}
              </SheetTitle>
            </SheetHeader>

            {/* Menu info */}
            <div className="flex gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary/40">
                  {menu.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-text-main">{menu.name}</p>
                {menu.desc && (
                  <p className="text-xs text-text-muted mt-0.5">{menu.desc}</p>
                )}
                <p className="font-bold text-sm text-secondary mt-1">
                  {formatRupiah(menu.price)}
                </p>
              </div>
            </div>

            {/* Option groups */}
            <div className="space-y-5 mb-5">
              {menu.groups.map((group) => (
                <div key={group.name}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-text-main">
                      {group.name}
                    </h4>
                    {group.required && (
                      <span className="text-xs text-secondary font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.options.map((opt) => {
                      const isSelected = (selectedOptions[group.name] || []).includes(opt.name);
                      const hasError = errors.includes(group.name);
                      return (
                        <button
                          key={opt.name}
                          onClick={() =>
                            handleOptionChange(group.name, opt.name, group.allowMultiple)
                          }
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all tap-target ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : hasError
                              ? 'border-secondary/40 bg-secondary/5'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-text-main" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-text-main">
                              {opt.name}
                            </span>
                          </div>
                          {opt.priceAdjustment > 0 && (
                            <span className="text-sm font-medium text-text-muted">
                              +{formatRupiah(opt.priceAdjustment)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.includes(group.name) && (
                    <p className="text-xs text-secondary mt-1">
                      Pilih salah satu {group.name}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Note */}
            <div className="mb-5">
              <h4 className="font-semibold text-sm text-text-main mb-2">Catatan</h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: sambal ijo agak banyak"
                className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-primary min-h-[60px]"
              />
            </div>

            {/* Qty + Add */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg bg-white flex items-center justify-center tap-target active:scale-95 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-9 rounded-lg bg-white flex items-center justify-center tap-target active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-xl py-3.5 font-bold text-sm text-text-main tap-target"
              >
                {loadingRec ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Tambah ke Keranjang — {formatRupiah(computeTotal())}
                  </span>
                ) : (
                  `Tambah ke Keranjang — ${formatRupiah(computeTotal())}`
                )}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
