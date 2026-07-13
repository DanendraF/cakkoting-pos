'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOrders, seedDemoOrders } from '@/lib/mock-data';
import { formatRupiah, formatTime, formatDate } from '@/lib/format';
import type { Order, PaymentStatus } from '@/lib/types';
import {
  Download,
  Calendar,
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  FileBarChart,
  LogOut,
  TrendingUp,
  Receipt,
  Calculator,
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

// yyyy-mm-dd in local time, for <input type="date"> values
function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function summarizeItems(items: Order['items']): string {
  return items.map((it) => `${it.qty}x ${it.name}`).join(', ');
}

function paymentBadgeClass(status: PaymentStatus): string {
  switch (status) {
    case 'settlement':
      return 'bg-success/10 text-success';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'expire':
    case 'cancel':
      return 'bg-danger/10 text-danger';
    default:
      return 'bg-black/5 text-text-muted';
  }
}

function paymentLabel(status: PaymentStatus): string {
  switch (status) {
    case 'settlement':
      return 'Lunas';
    case 'pending':
      return 'Pending';
    case 'expire':
      return 'Kedaluwarsa';
    case 'cancel':
      return 'Dibatalkan';
    default:
      return status;
  }
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateInputValue(new Date())
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // --- Auth guard ---
  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTH_KEY) !== 'true') {
        router.replace('/admin/login');
        return;
      }
      setAuthed(true);
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  // --- Seed demo data + load orders once authed ---
  useEffect(() => {
    if (!authed) return;
    seedDemoOrders();
    setOrders(getAllOrders());
  }, [authed]);

  // --- Filter orders by selected date ---
  const filteredOrders = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const target = new Date(y, m - 1, d).toDateString();
    return orders
      .filter((o) => new Date(o.createdAt).toDateString() === target)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [orders, selectedDate]);

  // --- Summary stats for selected date ---
  const totalTransaksi = filteredOrders.length;
  const totalPendapatan = useMemo(
    () =>
      filteredOrders
        .filter((o) => o.paymentStatus === 'settlement')
        .reduce((sum, o) => sum + o.total, 0),
    [filteredOrders]
  );
  const rataPerOrder =
    totalTransaksi > 0 ? Math.round(totalPendapatan / totalTransaksi) : 0;

  // --- CSV export ---
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      toast.error('Tidak ada transaksi untuk diexport');
      return;
    }

    const header = 'Waktu,Meja,Items,Total,Status';
    const rows = filteredOrders.map((o) =>
      [
        formatTime(o.createdAt),
        o.tableId,
        summarizeItems(o.items),
        o.total.toString(),
        paymentLabel(o.paymentStatus),
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-transaksi-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Laporan berhasil diexport');
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    router.replace('/admin/login');
  };

  // --- Shared sidebar nav ---
  const renderNav = () => (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/admin/reports';
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

  // Still guarding / seeding — render nothing to avoid flash of empty state
  if (!authed) return null;

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
          <div className="py-6 md:py-8 border-b border-black/5 mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                  Laporan Transaksi
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  {formatDate(new Date(selectedDate + 'T00:00:00').toISOString())}
                </p>
              </div>

              {/* Date filter + export */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Calendar
                    className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    strokeWidth={2.2}
                  />
                  <input
                    type="date"
                    value={selectedDate}
                    max={toDateInputValue(new Date())}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-9 pr-3 py-2.5 rounded-xl border border-black/10 bg-bg-card text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-colors"
                    aria-label="Pilih tanggal"
                  />
                </div>
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" strokeWidth={2.2} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
            <SummaryCard
              label="Total Transaksi"
              value={totalTransaksi.toString()}
              icon={Receipt}
              accent="bg-primary/10 text-primary"
              hint="transaksi"
            />
            <SummaryCard
              label="Total Pendapatan"
              value={formatRupiah(totalPendapatan)}
              icon={TrendingUp}
              accent="bg-success/10 text-success"
              hint="dari transaksi lunas"
            />
            <SummaryCard
              label="Rata-rata per Order"
              value={formatRupiah(rataPerOrder)}
              icon={Calculator}
              accent="bg-secondary/10 text-secondary"
              hint="per transaksi"
            />
          </div>

          {/* Transaction table */}
          <div className="mt-6 md:mt-8 bg-bg-card rounded-2xl border border-black/5 p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-text-main">
                  Detail Transaksi
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {filteredOrders.length} transaksi pada tanggal ini
                </p>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-6 h-6 text-text-muted" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-text-main">
                  Belum ada transaksi pada tanggal ini
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Pilih tanggal lain atau buat transaksi baru.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-black/5">
                        <th className="py-3 pr-4 font-semibold">Waktu</th>
                        <th className="py-3 pr-4 font-semibold">Meja</th>
                        <th className="py-3 pr-4 font-semibold">Items</th>
                        <th className="py-3 pr-4 font-semibold text-right">Total</th>
                        <th className="py-3 pl-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="align-top">
                          <td className="py-3.5 pr-4 whitespace-nowrap font-medium text-text-main">
                            {formatTime(o.createdAt)}
                          </td>
                          <td className="py-3.5 pr-4 whitespace-nowrap text-text-main">
                            Meja {o.tableId}
                          </td>
                          <td className="py-3.5 pr-4 text-text-muted max-w-xs">
                            <p className="line-clamp-2">{summarizeItems(o.items)}</p>
                          </td>
                          <td className="py-3.5 pr-4 whitespace-nowrap text-right font-semibold text-text-main">
                            {formatRupiah(o.total)}
                          </td>
                          <td className="py-3.5 pl-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${paymentBadgeClass(
                                o.paymentStatus
                              )}`}
                            >
                              {paymentLabel(o.paymentStatus)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile stacked cards */}
                <div className="md:hidden flex flex-col gap-3">
                  {filteredOrders.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-xl border border-black/5 p-4 bg-bg-light"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-main">
                            {formatTime(o.createdAt)} · Meja {o.tableId}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${paymentBadgeClass(
                            o.paymentStatus
                          )}`}
                        >
                          {paymentLabel(o.paymentStatus)}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted mb-3">
                        {summarizeItems(o.items)}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-black/5">
                        <span className="text-xs text-text-muted">Total</span>
                        <span className="text-sm font-bold text-text-main">
                          {formatRupiah(o.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Summary card ---
function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="bg-bg-card rounded-2xl border border-black/5 p-5 md:p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl md:text-[28px] font-bold text-text-main mt-2 break-words">
            {value}
          </p>
          {hint && <p className="text-xs text-text-muted mt-1.5">{hint}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
