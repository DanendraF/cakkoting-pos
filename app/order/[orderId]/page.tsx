'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrder, updateOrderStatus } from '@/lib/mock-data';
import { formatRupiah, timeAgo } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PartyPopper,
  XCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { Toaster } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Status configuration                                               */
/* ------------------------------------------------------------------ */

type StatusConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  ringColor: string;
  bgColor: string;
  textColor: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'Menunggu Pembayaran',
    icon: Clock,
    iconColor: 'text-gray-500',
    ringColor: 'border-gray-300',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  paid: {
    label: 'Pesanan Diterima',
    icon: CheckCircle2,
    iconColor: 'text-primary',
    ringColor: 'border-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-text-main',
  },
  processing: {
    label: 'Sedang Dimasak',
    icon: ChefHat,
    iconColor: 'text-primary',
    ringColor: 'border-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-text-main',
  },
  completed: {
    label: 'Selesai — Selamat Menikmati!',
    icon: PartyPopper,
    iconColor: 'text-success',
    ringColor: 'border-success',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
  },
  cancelled: {
    label: 'Pesanan Dibatalkan',
    icon: XCircle,
    iconColor: 'text-danger',
    ringColor: 'border-danger',
    bgColor: 'bg-danger/10',
    textColor: 'text-danger',
  },
};

/* ------------------------------------------------------------------ */
/*  Progress timeline                                                  */
/* ------------------------------------------------------------------ */

const TIMELINE_STAGES: { key: OrderStatus; label: string }[] = [
  { key: 'paid', label: 'Dibayar' },
  { key: 'processing', label: 'Diproses' },
  { key: 'completed', label: 'Selesai' },
];

// Map each status to its index in the timeline (-1 = not yet on timeline).
const STAGE_INDEX: Record<OrderStatus, number> = {
  pending: -1,
  paid: 0,
  processing: 1,
  completed: 2,
  cancelled: -1,
};

function ProgressTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = STAGE_INDEX[status];
  const isCancelled = status === 'cancelled';

  return (
    <div className="flex items-center justify-between px-2">
      {TIMELINE_STAGES.map((stage, i) => {
        const reached = currentIndex >= i;
        const active = currentIndex === i;
        return (
          <div key={stage.key} className="flex flex-1 items-center last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500',
                  isCancelled
                    ? 'border-gray-200 bg-gray-100 text-gray-400'
                    : reached
                      ? active
                        ? 'border-primary bg-primary text-text-main scale-110 shadow-md'
                        : 'border-primary bg-primary/20 text-text-main'
                      : 'border-gray-200 bg-white text-gray-400',
                ].join(' ')}
              >
                {reached && !active ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={[
                  'text-[11px] font-medium transition-colors duration-300',
                  isCancelled
                    ? 'text-gray-400'
                    : active
                      ? 'text-text-main'
                      : reached
                        ? 'text-text-muted'
                        : 'text-gray-400',
                ].join(' ')}
              >
                {stage.label}
              </span>
            </div>
            {/* Connector */}
            {i < TIMELINE_STAGES.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className={[
                    'h-full transition-all duration-700 ease-out',
                    isCancelled
                      ? 'bg-gray-300'
                      : currentIndex > i
                        ? 'bg-primary w-full'
                        : currentIndex === i
                          ? 'bg-primary w-1/2'
                          : 'bg-transparent w-0',
                  ].join(' ')}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Order item row (read-only)                                         */
/* ------------------------------------------------------------------ */

function OrderItemRow({
  item,
}: {
  item: Order['items'][number];
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-text-main text-xs font-bold flex items-center justify-center mt-0.5">
            {item.qty}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm text-text-main leading-snug">
              {item.name}
            </p>
            {item.options.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {item.options.map((opt, idx) => (
                  <li
                    key={`${opt.groupName}-${opt.optionName}-${idx}`}
                    className="text-xs text-text-muted"
                  >
                    {opt.groupName}: <span className="text-text-main">{opt.optionName}</span>
                    {opt.priceAdjustment > 0 && (
                      <span className="text-text-muted">
                        {' '}(+{formatRupiah(opt.priceAdjustment)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {item.note && (
              <p className="mt-1 text-xs italic text-text-muted">
                “{item.note}”
              </p>
            )}
          </div>
        </div>
        <span className="flex-shrink-0 text-sm font-semibold text-text-main whitespace-nowrap">
          {formatRupiah(item.price * item.qty)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Not-found state                                                    */
/* ------------------------------------------------------------------ */

function OrderNotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-6">
      <div className="text-center max-w-xs animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gray-100 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-text-main mb-2">
          Pesanan tidak ditemukan
        </h1>
        <p className="text-sm text-text-muted mb-6">
          ID pesanan tidak valid atau sudah kedaluwarsa. Silakan kembali ke menu
          untuk membuat pesanan baru.
        </p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-text-main font-semibold text-sm active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Menu
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [isPolling, setIsPolling] = useState(false);

  /* ---- Initial load ---- */
  useEffect(() => {
    if (!orderId) return;
    const found = getOrder(orderId);
    setOrder(found ?? null);
  }, [orderId]);

  /* ---- Polling simulation ---- */
  const advanceStatus = useCallback((current: OrderStatus): OrderStatus => {
    const flow: OrderStatus[] = ['pending', 'paid', 'processing', 'completed'];
    const idx = flow.indexOf(current);
    if (idx === -1 || idx >= flow.length - 1) return current;
    // 30% chance to advance each tick (demo only).
    if (Math.random() < 0.3) {
      return flow[idx + 1];
    }
    return current;
  }, []);

  useEffect(() => {
    if (!orderId || !order) return;
    // Stop polling once we reach a terminal state.
    if (order.status === 'completed' || order.status === 'cancelled') return;

    const interval = setInterval(() => {
      setIsPolling(true);
      setTimeout(() => setIsPolling(false), 500);

      setOrder((prev) => {
        if (!prev) return prev;
        const next = advanceStatus(prev.status);
        if (next !== prev.status) {
          updateOrderStatus(orderId, next);
          return { ...prev, status: next };
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId, order?.status, advanceStatus]);

  /* ---- Loading ---- */
  if (order === undefined) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-text-muted animate-spin" />
      </div>
    );
  }

  /* ---- Not found ---- */
  if (order === null) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <OrderNotFound />
      </>
    );
  }

  /* ---- Order found ---- */
  const config = STATUS_CONFIG[order.status];
  const StatusIcon = config.icon;
  const orderNumber = order.id.split('-').slice(-2).join('-');

  return (
    <div className="min-h-screen bg-bg-light">
      <Toaster position="top-center" richColors />

      <div className="max-w-3xl mx-auto min-h-screen flex flex-col">
        {/* ---- Header ---- */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 safe-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-sm font-medium text-text-muted active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              Menu
            </button>
            <h1 className="font-bold text-sm text-text-main">Status Pesanan</h1>
            <div className="w-12" />
          </div>
        </header>

        {/* ---- Status indicator ---- */}
        <section className="px-4 pt-8 pb-6">
          <div
            key={order.status}
            className="flex flex-col items-center text-center animate-fade-in"
          >
            <div
              className={[
                'w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500',
                config.ringColor,
                config.bgColor,
              ].join(' ')}
            >
              <StatusIcon
                className={[
                  'w-11 h-11 transition-colors duration-500',
                  config.iconColor,
                ].join(' ')}
              />
            </div>
            <h2
              className={[
                'mt-4 text-lg font-bold leading-tight transition-colors duration-500',
                config.textColor,
              ].join(' ')}
            >
              {config.label}
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              {timeAgo(order.createdAt)}
            </p>
          </div>

          {/* Polling indicator */}
          <div className="h-5 mt-3 flex items-center justify-center">
            {isPolling && (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted animate-fade-in">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Memperbarui...
              </span>
            )}
          </div>
        </section>

        {/* ---- Progress timeline ---- */}
        <section className="px-4 pb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <ProgressTimeline status={order.status} />
          </div>
        </section>

        {/* ---- Order items ---- */}
        <section className="px-4 pb-6 flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-text-main">Detail Pesanan</h3>
              <span className="text-xs text-text-muted">
                {order.items.reduce((sum, i) => sum + i.qty, 0)} item
              </span>
            </div>
            <div className="px-4">
              {order.items.map((item, idx) => (
                <OrderItemRow key={idx} item={item} />
              ))}
            </div>
            <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-between">
              <span className="text-sm font-medium text-text-main">Total</span>
              <span className="text-base font-bold text-text-main">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>
        </section>

        {/* ---- Reference footer ---- */}
        <footer className="px-4 pb-6 pt-2 safe-bottom">
          <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
            <span>
              Meja <span className="font-semibold text-text-main">{order.tableId}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>
              No. <span className="font-semibold text-text-main">{orderNumber}</span>
            </span>
            {order.customerName && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="font-medium text-text-main">{order.customerName}</span>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
