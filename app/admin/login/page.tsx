'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const DEMO_EMAIL = 'admin@cakkoting.id';
const DEMO_PASSWORD = 'admin123';
const STORAGE_KEY = 'cakkoting_admin_auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(false);

    const emailOk = email.trim().toLowerCase() === DEMO_EMAIL;
    const passOk = password === DEMO_PASSWORD;

    if (emailOk && passOk) {
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // sessionStorage may be unavailable; proceed with redirect anyway
      }
      toast.success('Berhasil masuk');
      router.push('/admin');
      return;
    }

    // Wrong credentials
    setError(true);
    setSubmitting(false);
  };

  const inputBase =
    'w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 outline-none transition-colors disabled:opacity-60';

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-6 py-10 safe-top safe-bottom">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-[440px]">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-black/[0.04] px-8 py-10 sm:px-10 sm:py-12">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-sm">
              <span className="text-2xl font-extrabold text-primary-foreground select-none">
                CK
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">
              Cak Koting Admin
            </h1>
            <p className="text-sm text-text-muted mt-1.5">
              Masuk untuk mengelola restoran
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={error ? 'animate-shake' : ''}
            noValidate
          >
            {/* Email */}
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5"
            >
              Email / Username
            </label>
            <div className="relative mb-4">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="admin@cakkoting.id"
                disabled={submitting}
                className={`${inputBase} ${
                  error
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-neutral-200 text-text-main focus:border-primary bg-neutral-50'
                }`}
                aria-invalid={error}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {/* Password */}
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="••••••••"
                disabled={submitting}
                className={`${inputBase} ${
                  error
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-neutral-200 text-text-main focus:border-primary bg-neutral-50'
                }`}
                aria-invalid={error}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                id="login-error"
                className="mt-3 text-sm font-medium text-red-600"
                role="alert"
              >
                Email atau password salah
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all rounded-2xl py-4 font-semibold text-primary-foreground tap-target"
            >
              {submitting ? 'Memeriksa…' : 'Masuk'}
              {!submitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-5 text-center">
            <span className="text-sm text-text-muted font-medium cursor-pointer hover:text-primary-hover transition-colors select-none">
              Lupa password?
            </span>
          </div>

          {/* Demo hint */}
          <div className="mt-6 rounded-2xl bg-neutral-50 border border-neutral-100 px-4 py-3 text-center">
            <p className="text-xs text-text-muted">
              Demo:{' '}
              <span className="font-semibold text-text-main">
                admin@cakkoting.id / admin123
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-muted">
          Panel Admin · Rumah Makan Cak Koting
        </p>
      </div>
    </div>
  );
}
