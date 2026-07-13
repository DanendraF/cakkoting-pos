'use client';

import { getRestaurantInfo } from '@/lib/menu';
import { Phone, QrCode } from 'lucide-react';

export default function TableInvalidPage() {
  const restaurant = getRestaurantInfo();

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-6">
      <div className="max-w-[400px] w-full text-center">
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 rounded-3xl bg-white shadow-sm flex items-center justify-center">
            <QrCode className="w-12 h-12 text-text-muted" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-bold text-text-main mb-2">
          QR Code Tidak Dikenali
        </h1>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          Sepertinya QR code ini bermasalah. Silakan panggil staf kami untuk
          mendapatkan QR meja yang baru.
        </p>

        <div className="space-y-3">
          {restaurant.whatsapp.map((wa, i) => (
            <a
              key={i}
              href={`https://wa.me/62${wa.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl py-3.5 font-semibold text-sm text-text-main tap-target"
            >
              <Phone className="w-4 h-4" />
              {wa}
            </a>
          ))}
        </div>

        <p className="text-xs text-text-muted mt-6">
          {restaurant.name}
        </p>
      </div>
    </div>
  );
}
