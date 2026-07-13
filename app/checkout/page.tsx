'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { createOrder } from '@/lib/mock-data';
import { formatRupiah, generateOrderId } from '@/lib/format';
import type { Order, OrderItem, OrderStatus, PaymentStatus } from '@/lib/types';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  CreditCard,
  X,
  CheckCircle,
  QrCode,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

const LAST_ORDER_KEY = 'cakkoting_last_order';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, tableId, clearCart } = useCart();

  const [hydrated, setHydrated] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Wait for cart context to hydrate from sessionStorage before deciding redirects.
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect guards (only after hydration so we don't flash on first paint).
  useEffect(() => {
    if (!hydrated) return;
    if (totalItems === 0) {
      router.replace('/menu');
      return;
    }
    if (!tableId) {
      router.replace('/table-invalid');
    }
  }, [hydrated, totalItems, tableId, router]);

  // Lock body scroll while the payment modal is open.
  useEffect(() => {
    if (!paymentOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [paymentOpen]);

  // Close payment modal on Escape.
  useEffect(() => {
    if (!paymentOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelPayment();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOpen]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-bg-light">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="h-8 w-32 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  // While redirecting due to invalid state, render nothing to avoid fl/flicker.
  if (totalItems === 0 || !tableId) {
    return null;
  }

  const orderItems: OrderItem[] = items.map((ci) => ({
    name: ci.name,
    qty: ci.qty,
    options: ci.options,
    note: ci.note,
    price:
      ci.basePrice +
      ci.options.reduce((s, o) => s + o.priceAdjustment, 0),
  }));

  const handlePayNow = () => {
    if (submitting) return;
    setSubmitting(true);
    setPaymentCancelled(false);

    // Simulate async order creation (status pending) + opening Midtrans Snap popup.
    window.setTimeout(() => {
      try {
        const orderId = generateOrderId();
        const order: Order = {
          id: orderId,
          tableId: tableId as string,
          customerName: customerName.trim(),
          items: orderItems,
          total: totalPrice,
          status: 'pending' as OrderStatus,
          paymentStatus: 'pending' as PaymentStatus,
          createdAt: new Date().toISOString(),
        };
        // Simulate order created (pending) — persist only after payment success
        // to mimic a real Snap flow where the order is confirmed on settlement.
        setPendingOrder(order);
        setSubmitting(false);
        setPaymentOpen(true);
      } catch {
        setSubmitting(false);
        toast.error('Gagal membuat pesanan, coba lagi');
      }
    }, 700);
  };

  const handlePaymentSuccess = () => {
    if (!pendingOrder) return;
    try {
      const settled: Order = {
        ...pendingOrder,
        status: 'paid' as OrderStatus,
        paymentStatus: 'settlement' as PaymentStatus,
      };
      createOrder(settled);
      try {
        localStorage.setItem(LAST_ORDER_KEY, settled.id);
      } catch {
        // ignore quota errors
      }
      clearCart();
      router.push(`/order/${settled.id}`);
    } catch {
      toast.error('Gagal membuat pesanan, coba lagi');
      setPaymentOpen(false);
    }
  };

  const handleCancelPayment = () => {
    setPaymentOpen(false);
    setPendingOrder(null);
    setPaymentCancelled(true);
  };

  return (
    <div className="min-h-screen bg-bg-light pb-28">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 safe-top">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center tap-target active:scale-95 transition-transform"
            aria-label="Kembali"
          >
            <ChevronDown className="w-5 h-5 text-text-main rotate-90" />
          </button>
          <div>
            <h1 className="font-bold text-base text-text-main leading-tight">
              Pembayaran
            </h1>
            <p className="text-xs text-text-muted leading-tight">
              Selesaikan pesanan Anda
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Payment cancelled notice */}
        {paymentCancelled && (
          <div className="flex items-start gap-3 p-3 rounded-xl border border-secondary/30 bg-secondary/5 animate-shake">
            <X className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-main">
              Pembayaran belum selesai, tekan tombol untuk mencoba lagi
            </p>
          </div>
        )}

        {/* Collapsible order summary */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setSummaryOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 tap-target text-left active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-text-main" />
              </div>
              <div>
                <p className="font-bold text-sm text-text-main">
                  Ringkasan Pesanan
                </p>
                <p className="text-xs text-text-muted">
                  {totalItems} item · {formatRupiah(totalPrice)}
                </p>
              </div>
            </div>
            {summaryOpen ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </button>

          {summaryOpen && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 animate-fade-in">
              {items.map((ci) => {
                const unitPrice =
                  ci.basePrice +
                  ci.options.reduce((s, o) => s + o.priceAdjustment, 0);
                const lineTotal = unitPrice * ci.qty;
                return (
                  <div
                    key={ci.id}
                    className="flex items-start justify-between gap-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-main">
                        {ci.name}{' '}
                        <span className="text-text-muted font-normal">
                          ×{ci.qty}
                        </span>
                      </p>
                      {ci.options.length > 0 && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {ci.options
                            .map((o) => o.optionName)
                            .join(', ')}
                        </p>
                      )}
                      {ci.note && (
                        <p className="text-xs text-text-muted mt-0.5 italic">
                          “{ci.note}”
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-text-main whitespace-nowrap">
                      {formatRupiah(lineTotal)}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="font-bold text-sm text-text-main">
                  Total
                </span>
                <span className="font-bold text-sm text-secondary">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Customer info */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <div>
            <label
              htmlFor="customerName"
              className="block font-semibold text-sm text-text-main mb-2"
            >
              Nama Panggilan{' '}
              <span className="text-text-muted font-normal">(opsional)</span>
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={40}
              placeholder="Untuk memanggil pesanan Anda"
              className="w-full p-3 rounded-xl border border-gray-200 text-sm text-text-main placeholder:text-text-muted/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold text-sm text-text-main mb-2">
              Nomor Meja
            </label>
            <div className="w-full p-3 rounded-xl border border-gray-200 bg-bg-light flex items-center gap-2">
              <span className="text-sm text-text-main font-medium">
                Meja {tableId}
              </span>
              <span className="ml-auto text-xs text-text-muted">
                Otomatis terisi
              </span>
            </div>
          </div>
        </section>

        {/* Payment method hint */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-text-main">
                QRIS / E-Wallet
              </p>
              <p className="text-xs text-text-muted">
                Bayar dengan scan QR atau e-wallet via Midtrans
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
        </section>
      </main>

      {/* Sticky pay button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
        <div className="max-w-3xl mx-auto px-4 pb-3 pt-2 bg-gradient-to-t from-bg-light via-bg-light to-transparent">
          <button
            onClick={handlePayNow}
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl px-5 py-4 flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-70 disabled:active:scale-100 tap-target"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 text-text-main animate-spin" />
                <span className="font-bold text-sm text-text-main">
                  Memproses…
                </span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 text-text-main" />
                <span className="font-bold text-sm text-text-main">
                  Bayar Sekarang — {formatRupiah(totalPrice)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mock Midtrans Snap payment modal */}
      {paymentOpen && pendingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelPayment();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Simulasi Pembayaran"
            className="w-full max-w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-text-main" />
                </div>
                <h2 className="font-bold text-base text-text-main">
                  Simulasi Pembayaran
                </h2>
              </div>
              <button
                onClick={handleCancelPayment}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center tap-target active:scale-95 transition-transform"
                aria-label="Tutup"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="px-5 pb-5 pt-4 space-y-4">
              {/* QR code placeholder */}
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 rounded-2xl border-2 border-gray-200 bg-white p-3">
                  {/* Fake QR pattern */}
                  <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
                    {Array.from({ length: 64 }).map((_, i) => {
                      // deterministic pseudo-random pattern
                      const filled =
                        (i * 37 + 13) % 3 === 0 ||
                        i < 8 ||
                        i % 8 === 0 ||
                        i % 8 === 7 ||
                        i >= 56;
                      return (
                        <div
                          key={i}
                          className={`rounded-[1px] ${
                            filled ? 'bg-text-main' : 'bg-transparent'
                          }`}
                        />
                      );
                    })}
                  </div>
                  {/* Corner markers */}
                  <div className="absolute top-3 left-3 w-10 h-10 border-4 border-text-main rounded-md bg-white" />
                  <div className="absolute top-3 right-3 w-10 h-10 border-4 border-text-main rounded-md bg-white" />
                  <div className="absolute bottom-3 left-3 w-10 h-10 border-4 border-text-main rounded-md bg-white" />
                  {/* Center logo overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md border-2 border-white">
                      <span className="text-[10px] font-bold text-text-main">
                        CK
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  Scan dengan QRIS / e-wallet
                </p>
              </div>

              {/* Order total */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-light">
                <span className="text-sm text-text-muted">Total Pembayaran</span>
                <span className="font-bold text-base text-secondary">
                  {formatRupiah(pendingOrder.total)}
                </span>
              </div>

              {/* Order meta */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>ID Pesanan</span>
                <span className="font-mono">{pendingOrder.id}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handlePaymentSuccess}
                  className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold text-sm text-text-main tap-target"
                >
                  <CheckCircle className="w-5 h-5" />
                  Bayar (Simulasi Berhasil)
                </button>
                <button
                  onClick={handleCancelPayment}
                  className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all rounded-xl py-3.5 font-bold text-sm text-text-main tap-target"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
