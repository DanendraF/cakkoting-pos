'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const DEMO_PIN = '1234';
const STORAGE_KEY = 'cakkoting_kitchen_auth';

export default function KitchenLoginPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(false);

    if (pin === DEMO_PIN) {
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // sessionStorage may be unavailable; proceed with redirect anyway
      }
      toast.success('Berhasil masuk');
      router.push('/kitchen');
      return;
    }

    // Wrong PIN
    setError(true);
    setSubmitting(false);
    setPin('');
    // Re-trigger shake animation by toggling state then refocusing
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-6 safe-top safe-bottom">
      <Toaster theme="dark" position="top-center" richColors />

      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl px-8 py-10 sm:px-10 sm:py-12">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center mb-5">
              <Lock className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">
              Dapur Cak Koting
            </h1>
            <p className="text-sm text-text-muted mt-1.5">
              Masukkan PIN untuk mengakses panel dapur
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={error ? 'animate-shake' : ''}
            noValidate
          >
            <label
              htmlFor="pin"
              className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5"
            >
              PIN / Kode Staf
            </label>

            <input
              ref={inputRef}
              id="pin"
              name="pin"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPin(digits);
                if (error) setError(false);
              }}
              placeholder="••••"
              disabled={submitting}
              className={`w-full text-center text-3xl font-bold tracking-[0.5em] py-4 px-4 rounded-2xl border-2 outline-none transition-colors placeholder:tracking-[0.4em] placeholder:text-neutral-300 placeholder:font-normal disabled:opacity-60 ${
                error
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-neutral-200 text-text-main focus:border-neutral-900 bg-neutral-50'
              }`}
              aria-invalid={error}
              aria-describedby={error ? 'pin-error' : undefined}
            />

            {error && (
              <p
                id="pin-error"
                className="mt-3 text-sm font-medium text-red-600 text-center"
                role="alert"
              >
                PIN tidak sesuai
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || pin.length < 4}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all rounded-2xl py-4 font-semibold text-white tap-target"
            >
              {submitting ? 'Memeriksa…' : 'Masuk'}
              {!submitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Demo hint */}
          <p className="mt-6 text-center text-xs text-text-muted">
            Demo PIN: <span className="font-semibold text-text-main">1234</span>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          Panel Dapur · Rumah Makan Cak Koting
        </p>
      </div>
    </div>
  );
}
