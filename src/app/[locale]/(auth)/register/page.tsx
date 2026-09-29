'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Scissors, Mail, Lock, User, GraduationCap, Home, AlertCircle } from 'lucide-react';

const GRADES = ['1', '2', '3', '4', 'grad'] as const;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    university_grade: '1',
    dorm_resident: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError(t('errors.nameRequired')); return; }
    if (form.password.length < 6) { setError(t('errors.passwordTooShort')); return; }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // data.user exists even when email confirmation is pending
    if (data.user) {
      // Update profile with extra fields (trigger may have already created it)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: form.name,
        university_grade: form.university_grade,
        dorm_resident: form.dorm_resident,
        email: form.email,
      });

      // If session exists → go home. If email confirmation needed → show message.
      if (data.session) {
        window.location.href = `/${locale}`;
      } else {
        setError('✉️ Check your email to confirm your account, then log in.');
      }
    } else {
      setError(t('errors.registerFailed'));
    }

    setLoading(false);
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: 440 }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="Dorm Barbershop Logo"
            style={{ width: 72, height: 72, objectFit: 'contain', margin: '0 auto 0.5rem' }}
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {t('registerTitle')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Dorm Barbershop</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Name */}
          <div>
            <label className="label" htmlFor="reg-name">{t('name')}</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-name"
                className="input"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label" htmlFor="reg-email">{t('email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-email"
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                autoComplete="email"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label" htmlFor="reg-password">{t('password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-password"
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                autoComplete="new-password"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          {/* University Grade */}
          <div>
            <label className="label" htmlFor="reg-grade">{t('universityGrade')}</label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                id="reg-grade"
                className="input"
                value={form.university_grade}
                onChange={(e) => update('university_grade', e.target.value)}
                style={{ paddingLeft: '2.25rem', cursor: 'pointer' }}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{t(`grades.${g}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dorm Resident Toggle */}
          <div>
            <label className="label">{t('dormResident')}</label>
            <div style={{
              display: 'flex',
              background: 'var(--surface-2)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
              gap: '0.25rem',
            }}>
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => update('dorm_resident', val)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'calc(var(--radius-md) - 4px)',
                    border: 'none',
                    background: form.dorm_resident === val ? 'var(--brand-primary)' : 'transparent',
                    color: form.dorm_resident === val ? '#1a1400' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: form.dorm_resident === val ? 700 : 400,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <Home size={13} />
                  {val ? t('dormResidentYes') : t('dormResidentNo')}
                </button>
              ))}
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
            {t('registerBtn')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
            {t('loginBtn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
