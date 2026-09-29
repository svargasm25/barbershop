'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const t = useTranslations('auth');
  const params = useParams();
  const locale = params.locale as string;
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {t('updatePasswordTitle')}
          </h1>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(91,184,118,0.1)', borderRadius: 'var(--radius-md)', color: 'var(--status-completed)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {t('passwordUpdated')}
            </div>
            <Link href={`/${locale}/login`} className="btn btn-primary" style={{ width: '100%', display: 'block', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">{t('newPassword')}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(224,85,85,0.1)', color: 'var(--brand-danger)', fontSize: '0.875rem' }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {t('savePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
