'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RefreshCw, ChefHat, LayoutDashboard, Utensils, Phone } from 'lucide-react';
import { getRestaurantInfo } from '@/lib/menu';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 text-danger"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-text-main mb-2">
          Ada Gangguan Sistem
        </h1>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          Tim kami sedang menangani ini. Silakan coba beberapa saat lagi.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl px-6 py-3.5 font-semibold text-sm text-text-main tap-target w-full justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all rounded-2xl px-6 py-3.5 font-semibold text-sm text-text-main tap-target w-full justify-center"
          >
            <BackIcon className="w-4 h-4" />
            {backLabel}
          </button>
        </div>

        {area === 'customer' && (
          <div className="pt-4 border-t border-gray-100 mt-6">
            <p className="text-xs text-text-muted mb-3">
              Butuh bantuan darurat? Hubungi kami:
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
