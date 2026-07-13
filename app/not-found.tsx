'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, ChefHat, LayoutDashboard, Utensils } from 'lucide-react';
import { getRestaurantInfo } from '@/lib/menu';
import { Phone } from 'lucide-react';

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const [area, setArea] = useState<'customer' | 'kitchen' | 'admin'>('customer');

  useEffect(() => {
    if (pathname.startsWith('/kitchen')) setArea('kitchen');
    else if (pathname.startsWith('/admin')) setArea('admin');
    else setArea('customer');
  }, [pathname]);

  const handleBack = () => {
    if (area === 'kitchen') router.push('/kitchen');
    else if (area === 'admin') router.push('/admin');
    else {
      const tableId = sessionStorage.getItem('cakkoting_table');
      router.push(tableId ? `/menu?meja=${tableId}` : '/table-invalid');
    }
  };

  const backLabel =
    area === 'kitchen'
      ? 'Kembali ke Antrean'
      : area === 'admin'
      ? 'Kembali ke Dashboard'
      : 'Kembali ke Menu';

  const BackIcon =
    area === 'kitchen' ? ChefHat : area === 'admin' ? LayoutDashboard : Utensils;

  const restaurant = getRestaurantInfo();

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-6">
      <div className="max-w-[400px] w-full text-center">
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 rounded-3xl bg-white shadow-sm flex items-center justify-center">
            <span className="text-5xl font-bold text-primary/50">404</span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-text-main mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          Sepertinya halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>

        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl px-6 py-3.5 font-semibold text-sm text-text-main tap-target mb-4"
        >
          <BackIcon className="w-4 h-4" />
          {backLabel}
        </button>

        {area === 'customer' && (
          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="text-xs text-text-muted mb-3">
              Butuh bantuan? Hubungi kami:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {restaurant.whatsapp.map((wa, i) => (
                <a
                  key={i}
                  href={`https://wa.me/62${wa.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary bg-secondary/5 px-3 py-2 rounded-full hover:bg-secondary/10 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {wa}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
