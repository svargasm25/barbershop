'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Scissors, Sun, Moon, LogOut, CalendarCheck, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Profile } from '@/lib/types';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/login`;
  }

  return (
    <header
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--surface-border)',
      }}
    >
      <div className="page-container" style={{ padding: '0 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* Logo */}
          <Link
            href={`/${locale}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: 'var(--text-primary)',
            }}
          >
            <img 
              src="/logo.png" 
              alt="Dorm Barbershop Logo" 
              style={{ width: 44, height: 44, objectFit: 'contain' }} 
            />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--brand-primary)' }}>
              Dorm <span className="text-gradient">Barbershop</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden-mobile">
            {profile && (
              <>
                {profile.role === 'client' && (
                  <>
                    <NavLink href={`/${locale}/book`} icon={<Scissors size={14} />} label={t('book')} />
                    <NavLink href={`/${locale}/appointments`} icon={<CalendarCheck size={14} />} label={t('appointments')} />
                  </>
                )}
                {profile.role === 'barber' && (
                  <NavLink href={`/${locale}/barber`} icon={<LayoutDashboard size={14} />} label={t('dashboard')} />
                )}
              </>
            )}
          </nav>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LanguageSwitcher />

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}

            {profile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {profile.role === 'client' ? (
                  <Link href={`/${locale}/profile`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      width: 32, height: 32,
                      background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                    }}>
                      {profile.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  </Link>
                ) : (
                  <div style={{
                    width: 32, height: 32,
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                  }}>
                    {profile.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title={t('logout')}
                >
                  <LogOut size={13} />
                  <span className="hidden-mobile">{t('logout')}</span>
                </button>
              </div>
            ) : (
              <Link href={`/${locale}/login`} className="btn btn-primary btn-sm">
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </header>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.4rem 0.75rem',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = 'var(--brand-primary)';
        (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
