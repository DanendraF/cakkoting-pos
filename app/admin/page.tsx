'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllOrders,
  getOrdersByDate,
  seedDemoOrders,
} from '@/lib/mock-data';
import { formatRupiah, formatDate } from '@/lib/format';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  FileBarChart,
  LogOut,
  TrendingUp,
  ShoppingBag,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { Toaster } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Order } from '@/lib/types';

const AUTH_KEY = 'cakkoting_admin_auth';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Kategori', icon: Tags },
  { href: '/admin/reports', label: 'Laporan', icon: FileBarChart },
];

interface ChartDatum {
  day: string;
  revenue: number;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
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

  // --- Today's summary ---
  const today = new Date();
  const todayOrders = useMemo(
    () => getOrdersByDate(today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders]
  );

  const totalOrder = todayOrders.length;
  const totalPendapatan = useMemo(
    () =>
      todayOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    [todayOrders]
  );
  const orderDibatalkan = todayOrders.filter(
    (o) => o.status === 'cancelled'
  ).length;

  // --- 7-day revenue chart data ---
  const chartData: ChartDatum[] = useMemo(() => {
    const data: ChartDatum[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayOrders = getOrdersByDate(d);
      const revenue = dayOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0);
      data.push({
        day: DAY_LABELS[d.getDay()],
        revenue,
      });
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 0);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    router.replace('/admin/login');
  };

  // --- Sidebar nav (shared markup, rendered in both desktop + mobile) ---
  const renderNav = (active: boolean) => (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active && item.href === '/admin';
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

        <div className="flex-1 px-3 py-4 overflow-y-auto">
          {renderNav(true)}
        </div>

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
            <div className="pt-3">{renderNav(true)}</div>
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
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                  Overview
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  {formatDate(today.toISOString())}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => router.push('/admin/menu')}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98]"
                >
                  <UtensilsCrossed className="w-4 h-4" strokeWidth={2.2} />
                  Kelola Menu
                </button>
                <button
                  onClick={() => router.push('/admin/reports')}
                  className="inline-flex items-center gap-2 bg-bg-card border border-black/10 hover:border-black/20 text-text-main font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98]"
                >
                  <FileBarChart className="w-4 h-4" strokeWidth={2.2} />
                  Lihat Laporan
                  <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
            <SummaryCard
              label="Total Order"
              value={totalOrder.toString()}
              icon={ShoppingBag}
              accent="bg-primary/10 text-primary"
              hint="hari ini"
            />
            <SummaryCard
              label="Total Pendapatan"
              value={formatRupiah(totalPendapatan)}
              icon={TrendingUp}
              accent="bg-success/10 text-success"
              hint="hari ini"
            />
            <SummaryCard
              label="Order Dibatalkan"
              value={orderDibatalkan.toString()}
              icon={Ban}
              accent="bg-danger/10 text-danger"
              hint="hari ini"
            />
          </div>

          {/* Revenue chart */}
          <div className="mt-6 md:mt-8 bg-bg-card rounded-2xl border border-black/5 p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-text-main">
                  Pendapatan 7 Hari Terakhir
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Ringkasan pendapatan harian
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                Pendapatan
              </div>
            </div>

            <div className="h-64 md:h-72 w-full">
              {maxRevenue === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-text-muted" strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium text-text-main">
                    Belum ada pendapatan
                  </p>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Data pendapatan akan muncul di sini setelah ada order yang
                    berhasil diselesaikan.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: '#666666' }}
                      axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#666666' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
                      }
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 12,
                        fontSize: 12,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                      labelStyle={{ color: '#212121', fontWeight: 600 }}
                      formatter={(value: number) => [
                        formatRupiah(value),
                        'Pendapatan',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#FFD400"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#FFD400', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#FFD400', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent orders (bonus context, empty-safe) */}
          <div className="mt-6 md:mt-8 bg-bg-card rounded-2xl border border-black/5 p-5 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-text-main mb-4">
              Order Terbaru
            </h2>
            {todayOrders.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-text-muted" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-text-main">
                  Belum ada order hari ini
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Order yang masuk akan ditampilkan di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {todayOrders.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">
                        {o.id}
                        {o.customerName ? ` · ${o.customerName}` : ''}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Meja {o.tableId} · {o.items.length} item
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-text-main">
                        {formatRupiah(o.total)}
                      </p>
                      <p className="text-xs text-text-muted capitalize mt-0.5">
                        {o.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
  icon: typeof ShoppingBag;
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
          {hint && (
            <p className="text-xs text-text-muted mt-1.5">{hint}</p>
          )}
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
