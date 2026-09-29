'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Scissors, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(t('errors.loginFailed'));
    } else {
      window.location.href = `/${locale}`;
    }
    setLoading(false);
  }
  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="Dorm Barbershop Logo"
            style={{ width: 72, height: 72, objectFit: 'contain', margin: '0 auto 0.5rem' }}
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {t('loginTitle')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Dorm Barbershop</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" htmlFor="login-email">{t('email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="login-password">{t('password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <Link href={`/${locale}/forgot-password`} style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', textDecoration: 'none' }}>
                {t('forgotPassword')}
              </Link>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.2)',
              color: 'var(--brand-danger)', fontSize: '0.875rem',
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            {t('loginBtn')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {t('noAccount')}{' '}
          <Link href={`/${locale}/register`} style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
            {t('registerBtn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
