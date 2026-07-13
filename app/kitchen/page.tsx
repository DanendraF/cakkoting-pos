'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getKitchenOrders,
  updateOrderStatus,
  seedDemoOrders,
} from '@/lib/mock-data';
import { timeAgo, formatTime } from '@/lib/format';
import type { KitchenOrder, OrderItem, OrderStatus } from '@/lib/types';
import {
  ChefHat,
  LogOut,
  Clock,
  Check,
  CookingPot,
  Utensils,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

const AUTH_KEY = 'cakkoting_kitchen_auth';
const POLL_INTERVAL = 4000;

type ColumnKey = 'paid' | 'processing' | 'completed';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  icon: typeof ChefHat;
  accent: string;
  headerBg: string;
  headerText: string;
  countBadge: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: 'paid',
    label: 'Masuk',
    icon: Utensils,
    accent: 'bg-primary',
    headerBg: 'bg-primary/10',
    headerText: 'text-text-main',
    countBadge: 'bg-primary text-primary-foreground',
  },
  {
    key: 'processing',
    label: 'Diproses',
    icon: CookingPot,
    accent: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    headerText: 'text-blue-700',
    countBadge: 'bg-blue-500 text-white',
  },
  {
    key: 'completed',
    label: 'Selesai',
    icon: Check,
    accent: 'bg-success',
    headerBg: 'bg-success/10',
    headerText: 'text-success',
    countBadge: 'bg-success text-success-foreground',
  },
];

interface TableGroup {
  tableId: string;
  customerName: string;
  orders: KitchenOrder[];
}

export default function KitchenDashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [polling, setPolling] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [activeTab, setActiveTab] = useState<ColumnKey>('paid');
  const [highlightedOrders, setHighlightedOrders] = useState<Set<string>>(
    new Set()
  );
  const [now, setNow] = useState(Date.now());
  const seededRef = useRef(false);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  // --- Auth guard ---
  useEffect(() => {
    isMountedRef.current = true;
    try {
      const ok = sessionStorage.getItem(AUTH_KEY) === 'true';
      if (!ok) {
        router.replace('/kitchen/login');
        return;
      }
      setAuthed(true);
    } catch {
      router.replace('/kitchen/login');
      return;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [router]);

  // --- Seed demo orders once on first mount ---
  useEffect(() => {
    if (!authed || seededRef.current) return;
    seededRef.current = true;
    seedDemoOrders();
  }, [authed]);

  // --- Load orders from mock-data ---
  const loadOrders = useCallback(async () => {
    setPolling(true);
    // Simulate occasional connection failure (~12% chance)
    const willFail = Math.random() < 0.12;
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (willFail) {
      setDisconnected(true);
      setPolling(false);
      return;
    }
    const fresh = getKitchenOrders();
    if (!isMountedRef.current) return;
    setOrders(fresh);
    setDisconnected(false);

    // Detect newly-arrived orders to highlight
    const currentIds = new Set(fresh.map((o) => o.id));
    const prevIds = prevOrderIdsRef.current;
    const newIds = fresh
      .filter((o) => !prevIds.has(o.id))
      .map((o) => o.id);
    if (prevIds.size > 0 && newIds.length > 0) {
      setHighlightedOrders(new Set(newIds));
      const t = setTimeout(() => {
        if (isMountedRef.current) setHighlightedOrders(new Set());
      }, 4000);
      void t;
    }
    prevOrderIdsRef.current = currentIds;
    setPolling(false);
  }, []);

  // --- Initial load + polling ---
  useEffect(() => {
    if (!authed) return;
    loadOrders();
    const id = setInterval(loadOrders, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [authed, loadOrders]);

  // --- Tick clock for elapsed-time refresh ---
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [authed]);

  // --- Group orders by tableId, per column ---
  const columns = useMemo(() => {
    const byStatus: Record<ColumnKey, TableGroup[]> = {
      paid: [],
      processing: [],
      completed: [],
    };
    const grouped = new Map<string, KitchenOrder[]>();
    for (const o of orders) {
      const arr = grouped.get(o.tableId) ?? [];
      arr.push(o);
      grouped.set(o.tableId, arr);
    }
    const groupedEntries = Array.from(grouped.entries());
    for (const [tableId, tableOrders] of groupedEntries) {
      const status = tableOrders[0].status as ColumnKey;
      if (status !== 'paid' && status !== 'processing' && status !== 'completed')
        continue;
      const sortedOrders: KitchenOrder[] = tableOrders
        .slice()
        .sort(
          (a: KitchenOrder, b: KitchenOrder) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      byStatus[status].push({
        tableId,
        customerName: tableOrders[0].customerName,
        orders: sortedOrders,
      });
    }
    // Sort each column: oldest first (longest waiting up top)
    for (const key of Object.keys(byStatus) as ColumnKey[]) {
      byStatus[key].sort((a, b) => {
        const aTime = new Date(a.orders[0].createdAt).getTime();
        const bTime = new Date(b.orders[0].createdAt).getTime();
        return aTime - bTime;
      });
    }
    return byStatus;
  }, [orders]);

  // --- Status update handler ---
  const handleUpdateStatus = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      updateOrderStatus(orderId, newStatus);
      const labels: Partial<Record<OrderStatus, string>> = {
        processing: 'Pesanan diproses',
        completed: 'Pesanan selesai',
      };
      if (labels[newStatus]) toast.success(labels[newStatus]);
      // Optimistic refresh
      loadOrders();
    },
    [loadOrders]
  );

  const handleLogout = useCallback(() => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    router.replace('/kitchen/login');
  }, [router]);

  const handleRetry = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  // --- Render gate: wait for auth check ---
  if (authed === null) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-sm">Memuat dapur...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <Toaster position="top-center" richColors />

      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-lg text-text-main">
                Dapur Cak Koting
              </h1>
              <p className="text-xs text-text-muted">Antrian pesanan dapur</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Connection / polling status */}
          <div className="flex items-center gap-2">
            {disconnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-danger/10 text-danger text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  Koneksi terputus, mencoba lagi...
                </span>
                <span className="sm:hidden">Koneksi terputus</span>
              </span>
            ) : polling ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 text-text-main text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memperbarui...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="hidden sm:inline">Live</span>
              </span>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-text-main text-sm font-medium transition-colors tap-target"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* ===== Mobile tabs ===== */}
        <div className="md:hidden flex border-t border-gray-100">
          {COLUMNS.map((col) => {
            const count = columns[col.key].length;
            const active = activeTab === col.key;
            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                  active
                    ? 'text-text-main'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <col.icon className="w-4 h-4" />
                <span>{col.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold ${
                    active ? col.countBadge : 'bg-gray-200 text-text-muted'
                  }`}
                >
                  {count}
                </span>
                {active && (
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${col.accent}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ===== Main ===== */}
      <main className="flex-1 p-3 md:p-5">
        {/* Desktop: 3 columns side by side */}
        <div className="hidden md:grid grid-cols-3 gap-4 lg:gap-5 h-full">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              config={col}
              groups={columns[col.key]}
              highlightedOrders={highlightedOrders}
              onUpdateStatus={handleUpdateStatus}
              now={now}
            />
          ))}
        </div>

        {/* Mobile: active tab only */}
        <div className="md:hidden">
          {COLUMNS.filter((c) => c.key === activeTab).map((col) => (
            <Column
              key={col.key}
              config={col}
              groups={columns[col.key]}
              highlightedOrders={highlightedOrders}
              onUpdateStatus={handleUpdateStatus}
              now={now}
              onRetry={handleRetry}
              disconnected={disconnected}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// ============ Column ============
interface ColumnProps {
  config: ColumnConfig;
  groups: TableGroup[];
  highlightedOrders: Set<string>;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  now: number;
  onRetry?: () => void;
  disconnected?: boolean;
}

function Column({
  config,
  groups,
  highlightedOrders,
  onUpdateStatus,
  now,
  onRetry,
  disconnected,
}: ColumnProps) {
  const Icon = config.icon;
  const isEmpty = groups.length === 0;

  return (
    <section className="flex flex-col min-h-0">
      {/* Column header */}
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-t-xl ${config.headerBg}`}
      >
        <Icon className={`w-5 h-5 ${config.headerText}`} />
        <h2 className={`font-semibold text-sm ${config.headerText}`}>
          {config.label}
        </h2>
        <span
          className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold ${config.countBadge}`}
        >
          {groups.reduce((acc, g) => acc + g.orders.length, 0)}
        </span>
      </div>

      {/* Column body */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 border-x border-b border-gray-200 rounded-b-xl p-2.5 space-y-3 min-h-[200px]">
        {isEmpty ? (
          <EmptyState disconnected={!!disconnected} onRetry={onRetry} />
        ) : (
          groups.map((group) => (
            <TableCard
              key={group.tableId}
              group={group}
              columnKey={config.key}
              highlightedOrders={highlightedOrders}
              onUpdateStatus={onUpdateStatus}
              now={now}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ============ Empty state ============
function EmptyState({
  disconnected,
  onRetry,
}: {
  disconnected: boolean;
  onRetry?: () => void;
}) {
  if (disconnected && onRetry) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <AlertCircle className="w-8 h-8 text-danger mb-2" />
        <p className="text-sm text-text-muted mb-3">Gagal memuat pesanan</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-text-main text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Coba lagi
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <Utensils className="w-8 h-8 text-gray-300 mb-2" />
      <p className="text-sm text-text-muted">Belum ada pesanan masuk</p>
    </div>
  );
}

// ============ Table card (grouped per table) ============
interface TableCardProps {
  group: TableGroup;
  columnKey: ColumnKey;
  highlightedOrders: Set<string>;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  now: number;
}

function TableCard({
  group,
  columnKey,
  highlightedOrders,
  onUpdateStatus,
  now,
}: TableCardProps) {
  const hasNew = group.orders.some((o) => highlightedOrders.has(o.id));
  // newest order in this group drives the "new" highlight
  const newestId = group.orders[group.orders.length - 1]?.id;
  const isNew = hasNew && newestId && highlightedOrders.has(newestId);

  return (
    <article
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ${
        isNew ? 'animate-pulse-yellow border-primary' : ''
      }`}
    >
      {/* Card header: table number + customer */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-text-main text-white flex items-center justify-center font-bold text-sm shrink-0">
            {group.tableId}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-muted leading-tight">Meja</p>
            <p className="font-bold text-base text-text-main leading-tight truncate">
              {group.customerName || 'Tanpa nama'}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs text-text-muted font-medium">
          {group.orders.length} pesanan
        </span>
      </div>

      {/* Order sub-blocks */}
      <div className="divide-y divide-gray-100">
        {group.orders.map((order, idx) => (
          <OrderSubBlock
            key={order.id}
            order={order}
            columnKey={columnKey}
            showDivider={idx > 0}
            onUpdateStatus={onUpdateStatus}
            now={now}
          />
        ))}
      </div>
    </article>
  );
}

// ============ Order sub-block ============
interface OrderSubBlockProps {
  order: KitchenOrder;
  columnKey: ColumnKey;
  showDivider: boolean;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  now: number;
}

function OrderSubBlock({
  order,
  columnKey,
  onUpdateStatus,
  now,
}: OrderSubBlockProps) {
  return (
    <div className="p-3.5">
      {/* Order meta row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-medium text-text-muted">
          #{order.id.slice(-5)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
          <Clock className="w-3 h-3" />
          <span title={formatTime(order.createdAt)}>
            {timeAgo(order.createdAt)}
          </span>
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-2 mb-3">
        {order.items.map((item, i) => (
          <OrderItemRow key={`${order.id}-${i}`} item={item} />
        ))}
      </ul>

      {/* Action button */}
      {columnKey === 'paid' && (
        <ActionButton
          onClick={() => onUpdateStatus(order.id, 'processing')}
          variant="primary"
          icon={CookingPot}
          label="Proses / Masak"
        />
      )}
      {columnKey === 'processing' && (
        <ActionButton
          onClick={() => onUpdateStatus(order.id, 'completed')}
          variant="success"
          icon={Check}
          label="Selesai / Antar"
        />
      )}
      {columnKey === 'completed' && (
        <div className="flex items-center justify-center gap-1.5 h-11 rounded-lg bg-success/10 text-success text-sm font-medium">
          <Check className="w-4 h-4" />
          <span>Selesai</span>
        </div>
      )}
    </div>
  );
}

// ============ Order item row ============
function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <li className="text-sm">
      <div className="flex items-start gap-2">
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded bg-primary/15 text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
          {item.qty}×
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-main leading-snug">{item.name}</p>
          {item.options.length > 0 && (
            <ul className="mt-0.5 space-y-0.5">
              {item.options.map((opt, i) => (
                <li
                  key={i}
                  className="text-xs text-text-muted leading-snug flex items-center gap-1"
                >
                  <span className="text-gray-300">•</span>
                  <span>
                    {opt.groupName}: <span>{opt.optionName}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {item.note && (
            <p className="mt-1 text-xs font-bold text-secondary bg-secondary/5 border border-secondary/15 rounded px-2 py-1 leading-snug">
              Catatan: {item.note}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

// ============ Action button ============
interface ActionButtonProps {
  onClick: () => void;
  variant: 'primary' | 'success';
  icon: typeof ChefHat;
  label: string;
}

function ActionButton({ onClick, variant, icon: Icon, label }: ActionButtonProps) {
  const styles =
    variant === 'primary'
      ? 'bg-primary hover:bg-primary-hover text-primary-foreground'
      : 'bg-success hover:bg-success/90 text-success-foreground';
  return (
    <button
      onClick={onClick}
      className={`w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] tap-target ${styles}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
