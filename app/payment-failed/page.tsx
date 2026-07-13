'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrder } from '@/lib/mock-data';
import { formatRupiah } from '@/lib/format';
import type { Order } from '@/lib/types';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function PaymentFailedPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = localStorage.getItem('cakkoting_last_order');
    if (orderId) {
      const o = getOrder(orderId);
      setOrder(o || null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-6">
      <div className="max-w-[400px] w-full text-center">
        <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-danger" />
        </div>

        <h1 className="text-xl font-bold text-text-main mb-2">
          Pembayaran Tidak Berhasil
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Pembayaran Anda kedaluwarsa atau dibatalkan. Silakan coba lagi.
        </p>

        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted">Order ID</span>
              <span className="text-xs font-mono font-medium text-text-main">
                {order.id.slice(-8)}
              </span>
            </div>
            <div className="space-y-2 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text-main">
                    {item.qty}× {item.name}
                  </span>
                  <span className="text-text-muted">
                    {formatRupiah(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <span className="font-bold text-sm text-text-main">Total</span>
              <span className="font-bold text-sm text-secondary">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/checkout')}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl py-3.5 font-semibold text-sm text-text-main tap-target"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Bayar Lagi
          </button>
          <button
            onClick={() => router.push('/menu')}
            className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all rounded-2xl py-3.5 font-semibold text-sm text-text-main tap-target"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
}
