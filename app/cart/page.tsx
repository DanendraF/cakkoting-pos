'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, computeItemTotal } from '@/lib/cart-context';
import { getMenuItem } from '@/lib/menu';
import { formatRupiah } from '@/lib/format';
import type { CartItem } from '@/lib/types';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQty,
    updateNote,
    totalItems,
    totalPrice,
    tableId,
  } = useCart();

  // Check for items that are no longer available on the menu
  const unavailableItems = useMemo(
    () => items.filter((item) => {
      const menuItem = getMenuItem(item.menuId);
      return !menuItem || !menuItem.isAvailable;
    }),
    [items]
  );
  const hasUnavailable = unavailableItems.length > 0;

  const handleCheckout = () => {
    if (hasUnavailable) {
      toast.error('Beberapa menu sudah habis, mohon hapus dari keranjang');
      return;
    }
    router.push('/checkout');
  };

  const handleBackToMenu = () => {
    const url = tableId ? `/menu?meja=${tableId}` : '/menu';
    router.push(url);
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 safe-top">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBackToMenu}
            className="flex items-center gap-1 text-text-muted hover:text-text-main transition-colors tap-target -ml-2 px-2"
            aria-label="Kembali ke menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base text-text-main leading-tight">
              Keranjang
            </h1>
            <p className="text-xs text-text-muted leading-tight">
              {totalItems > 0 ? `${totalItems} item dipesan` : 'Belum ada pesanan'}
            </p>
          </div>
          {tableId && (
            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
              <span className="text-xs font-semibold text-text-main">
                Meja {tableId}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-44">
        {items.length === 0 ? (
          <EmptyState onLihatMenu={handleBackToMenu} />
        ) : (
          <>
            {/* Unavailable notice */}
            {hasUnavailable && (
              <div className="mb-4 p-3 rounded-xl bg-secondary/5 border border-secondary/20 flex items-start gap-2 animate-fade-in">
                <span className="text-sm text-secondary font-medium leading-snug">
                  Beberapa menu baru saja habis. Hapus dari keranjang untuk melanjutkan pembayaran.
                </span>
              </div>
            )}

            {/* Cart items */}
            <div className="space-y-3">
              {items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  onRemove={(id) => {
                    removeItem(id);
                    toast.success(`${item.name} dihapus dari keranjang`);
                  }}
                  onQtyChange={(id, qty) => updateQty(id, qty)}
                  onNoteChange={(id, note) => updateNote(id, note)}
                />
              ))}
            </div>

            {/* Tambah menu lagi link */}
            <button
              onClick={handleBackToMenu}
              className="mt-5 flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors tap-target px-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tambah menu lagi</span>
            </button>
          </>
        )}
      </main>

      {/* Sticky bottom summary + checkout */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom bg-white/95 backdrop-blur-sm border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 pt-3 pb-3">
            {/* Summary */}
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Subtotal</span>
                <span className="text-sm font-semibold text-text-main">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-gray-200">
                <span className="text-base font-bold text-text-main">Total</span>
                <span className="text-base font-bold text-secondary">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={hasUnavailable}
              className={`w-full rounded-2xl py-3.5 font-bold text-sm transition-all tap-target active:scale-[0.98] ${
                hasUnavailable
                  ? 'bg-gray-200 text-text-muted cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover text-text-main shadow-lg shadow-primary/30'
              }`}
            >
              {hasUnavailable
                ? 'Hapus menu yang habis dulu'
                : 'Isi Nama & Bayar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onLihatMenu }: { onLihatMenu: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center pt-24 animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-primary/60" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
          <span className="text-lg">😴</span>
        </div>
      </div>

      <h2 className="text-lg font-bold text-text-main mb-1">
        Keranjang masih kosong
      </h2>
      <p className="text-sm text-text-muted mb-6 max-w-[260px] leading-relaxed">
        Yuk, pilih menu favoritmu dan tambahkan ke keranjang untuk mulai memesan.
      </p>

      <button
        onClick={onLihatMenu}
        className="bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl px-8 py-3.5 font-bold text-sm text-text-main tap-target shadow-lg shadow-primary/30"
      >
        Lihat Menu
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cart row — swipe-to-delete + qty stepper + inline note              */
/* ------------------------------------------------------------------ */

interface CartRowProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
  onNoteChange: (id: string, note: string) => void;
}

function CartRow({ item, onRemove, onQtyChange, onNoteChange }: CartRowProps) {
  const menuItem = getMenuItem(item.menuId);
  const isUnavailable = !menuItem || !menuItem.isAvailable;

  // Swipe-to-delete state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const MAX_REVEAL = -72; // trash button width

  // Reset drag position when item changes (e.g. after qty update)
  useEffect(() => {
    setDragX(0);
  }, [item.id, item.qty]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only start swipe on horizontal gesture; ignore if target is interactive
    const target = e.target as HTMLElement;
    if (target.closest('button, textarea, input, a')) return;

    startX.current = e.clientX;
    currentX.current = 0;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientX - startX.current;
    // Only allow leftward drag (negative), resist rightward
    const clamped = Math.min(0, Math.max(MAX_REVEAL * 1.5, delta));
    currentX.current = clamped;
    setDragX(clamped);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap: if dragged past halfway, reveal trash; else snap back
    setDragX(currentX.current < MAX_REVEAL / 2 ? MAX_REVEAL : 0);
  };

  const handleTrashClick = () => {
    setDragX(0);
    onRemove(item.id);
  };

  const subtotal = computeItemTotal(item);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Delete background (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-secondary rounded-2xl"
           style={{ width: 72 }}>
        <button
          onClick={handleTrashClick}
          className="w-full h-full flex items-center justify-center tap-target"
          aria-label={`Hapus ${item.name}`}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Foreground card */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
        }}
        className={`relative bg-white border rounded-2xl p-3 ${
          isUnavailable ? 'border-secondary/30 bg-gray-50/50' : 'border-gray-100'
        }`}
      >
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-xl font-bold text-primary/40">
                {item.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-bold text-sm leading-tight ${
                isUnavailable ? 'text-text-muted' : 'text-text-main'
              }`}>
                {item.name}
              </h3>
              <button
                onClick={handleTrashClick}
                className="flex-shrink-0 -mt-0.5 -mr-1 p-1.5 text-text-muted hover:text-secondary transition-colors tap-target rounded-lg"
                aria-label={`Hapus ${item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Variant chips */}
            {item.options.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.options.map((opt, idx) => (
                  <span
                    key={`${opt.groupName}-${opt.optionName}-${idx}`}
                    className="text-[11px] bg-gray-100 text-text-muted px-1.5 py-0.5 rounded font-medium"
                  >
                    {opt.optionName}
                    {opt.priceAdjustment > 0 && (
                      <span className="text-text-muted/70">
                        {' '}+{formatRupiah(opt.priceAdjustment)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Unavailable badge */}
            {isUnavailable && (
              <div className="mt-2 inline-flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-md">
                <span className="text-[11px] font-semibold text-secondary">
                  Menu ini baru saja habis
                </span>
              </div>
            )}

            {/* Qty stepper + subtotal */}
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1.5 py-1">
                <button
                  onClick={() => onQtyChange(item.id, item.qty - 1)}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center tap-target active:scale-90 transition-transform shadow-sm"
                  aria-label="Kurangi jumlah"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm w-6 text-center select-none">
                  {item.qty}
                </span>
                <button
                  onClick={() => onQtyChange(item.id, item.qty + 1)}
                  disabled={isUnavailable}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center tap-target active:scale-90 transition-transform shadow-sm disabled:opacity-40"
                  aria-label="Tambah jumlah"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className={`font-bold text-sm ${
                isUnavailable ? 'text-text-muted' : 'text-secondary'
              }`}>
                {formatRupiah(subtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Inline note editor */}
        <NoteEditor
          note={item.note}
          onChange={(note) => onNoteChange(item.id, note)}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline note editor                                                   */
/* ------------------------------------------------------------------ */

function NoteEditor({
  note,
  onChange,
}: {
  note: string;
  onChange: (note: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync draft when external note changes
  useEffect(() => {
    setDraft(note);
  }, [note]);

  // Auto-focus + auto-resize when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(draft.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(note);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSave();
            }
            if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          placeholder="Contoh: sambal ijo agak banyak, level pedas sedang"
          className="w-full p-2.5 rounded-xl border border-gray-200 text-xs resize-none focus:outline-none focus:border-primary min-h-[44px] leading-relaxed"
          maxLength={200}
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-text-muted">
            Enter untuk simpan · Esc untuk batal
          </span>
          <button
            onClick={handleSave}
            className="text-xs font-semibold text-secondary hover:text-secondary-hover transition-colors px-2 py-1"
          >
            Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="mt-2.5 w-full text-left flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors pt-2 border-t border-gray-50"
    >
      <span className="text-text-muted/60">📝</span>
      {note ? (
        <span className="truncate flex-1 italic">"{note}"</span>
      ) : (
        <span className="flex-1">Tambah catatan untuk item ini…</span>
      )}
      <span className="text-[10px] font-medium text-primary/70 flex-shrink-0">
        Edit
      </span>
    </button>
  );
}
