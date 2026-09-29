'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Scissors, ArrowRight, Sparkles } from 'lucide-react';
import { BASE_PRICE } from '@/lib/types';

export default function HomeContent({ locale }: { locale: string }) {
  const t = useTranslations('home');

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: 700, height: 700,
            background: 'radial-gradient(circle, rgba(0,51,102,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-15%', left: '-5%',
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        </div>

        <div className="page-container" style={{ padding: '4rem 1.25rem', width: '100%' }}>
          <div className="animate-fade-in" style={{ maxWidth: 640 }}>

            {/* Pill badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(0,51,102,0.3)',
              border: '1px solid rgba(0,51,102,0.5)',
              borderRadius: 100, padding: '0.375rem 1rem',
              fontSize: '0.8125rem', fontWeight: 600,
              color: 'var(--brand-primary)',
              marginBottom: '1.5rem',
            }}>
              <Sparkles size={12} />
              기숙사 전용 서비스 · Dorm Exclusive
            </div>

            {/* Heading */}
            <h1 style={{
              fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
            }}>
              Dorm{' '}
              <span className="text-gradient">Barbershop</span>
            </h1>

            <p style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: 480,
            }}>
              {t('subtitle')}
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href={`/${locale}/book`}
                className="btn btn-primary btn-lg"
                style={{ gap: '0.5rem' }}
              >
                <Scissors size={18} />
                {t('cta')}
                <ArrowRight size={16} />
              </Link>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                background: 'var(--surface-1)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--surface-border)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    ₩{BASE_PRICE.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Base Price
                  </div>
                </div>
              </div>
            </div>

            {/* Service note */}
            <div style={{
              marginTop: '2.5rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1.25rem',
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 'var(--radius-md)',
              maxWidth: 440,
            }}>
              <span style={{ fontSize: '1.25rem' }}>🚪</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t('doorService')}
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
