'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, User, GraduationCap, Home, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Appointment, Profile } from '@/lib/types';
import { BASE_PRICE, PENALTY_FEE } from '@/lib/types';
import { use } from 'react';

export default function AppointmentCheckout({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const t = useTranslations('barber');
  const router = useRouter();

  const [apt, setApt] = useState<Appointment | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<'completed' | 'no-show' | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('appointments')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setApt(data);
        setClient(data?.profiles ?? null);
        setLoading(false);
      });
  }, [id]);

  async function markCompleted() {
    if (!apt || !client) return;
    setProcessing(true);
    const supabase = createClient();
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', apt.id);
    await supabase.from('profiles').update({ penalty_fee: 0 }).eq('id', client.id);
    setDone('completed');
    setProcessing(false);
  }

  async function markNoShow() {
    if (!apt || !client) return;
    setProcessing(true);
    const supabase = createClient();
    await supabase.from('appointments').update({ status: 'no-show' }).eq('id', apt.id);
    await supabase.from('profiles').update({ penalty_fee: (client.penalty_fee ?? 0) + PENALTY_FEE }).eq('id', client.id);
    setDone('no-show');
    setProcessing(false);
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>;
  }

  if (!apt || !client) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Appointment not found.</div>;
  }

  const roomNumber = apt.room_number || client.room_number || '—';
  const penaltyApplied = apt.penalty_applied ?? 0;
  const total = BASE_PRICE + penaltyApplied;

  if (done) {
    return (
      <div className="page-container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <div className="animate-fade-in card" style={{ maxWidth: 420, margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            {done === 'completed' ? '✅' : '❌'}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {done === 'completed' ? 'Completada' : 'No-Show'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {done === 'completed'
              ? `Cobrado ₩${total.toLocaleString()} · Multa reseteada a ₩0`
              : `Multa ₩${PENALTY_FEE.toLocaleString()} añadida al perfil de ${client.name}`
            }
          </p>
          <Link href={`/${locale}/barber`} className="btn btn-primary btn-lg">← {t('dashboard')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ padding: '2.5rem 1.25rem' }}>
      <Link
        href={`/${locale}/barber`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}
      >
        <ChevronLeft size={14} /> {t('dashboard')}
      </Link>

      <h1 className="section-title">{t('appointment')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Client info */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
            {t('client')}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <InfoRow icon={<User size={15} />} label={t('client')} value={client.name ?? '—'} />
            <InfoRow icon={<GraduationCap size={15} />} label={t('grade')} value={client.university_grade ?? '—'} />
            <InfoRow icon={<Home size={15} />} label="Room" value={roomNumber} />
            <InfoRow icon={<></>} label="Date & Time" value={`${format(parseISO(apt.date), 'PPP')} · ${apt.time.slice(0, 5)}`} />
          </div>
        </div>

        {/* Checkout panel */}
        <div>
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              {t('toPay')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t('basePrice')}</span>
                <span>₩{BASE_PRICE.toLocaleString()}</span>
              </div>
              {penaltyApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
                  <span style={{ color: 'var(--brand-danger)' }}>{t('penaltyFeeLabel')}</span>
                  <span style={{ color: 'var(--brand-danger)' }}>+₩{penaltyApplied.toLocaleString()}</span>
                </div>
              )}
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>{t('toPay')}</span>
                <span style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--brand-primary)' }}>₩{total.toLocaleString()}</span>
              </div>
            </div>

            {penaltyApplied > 0 && (
              <div style={{
                display: 'flex', gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.8125rem', color: 'var(--brand-danger)',
              }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                This client has an outstanding penalty of ₩{penaltyApplied.toLocaleString()}. Collect total ₩{total.toLocaleString()}.
              </div>
            )}
          </div>

          {apt.status === 'pending' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={markCompleted}
                className="btn btn-success btn-lg"
                style={{ width: '100%' }}
                disabled={processing}
              >
                {processing ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <CheckCircle2 size={18} />}
                {t('markComplete')}
              </button>
              <button
                onClick={markNoShow}
                className="btn btn-danger btn-lg"
                style={{ width: '100%' }}
                disabled={processing}
              >
                {processing ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <XCircle size={18} />}
                {t('markNoShow')}
              </button>
            </div>
          ) : (
            <div style={{
              padding: '1rem', textAlign: 'center',
              background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', fontSize: '0.9rem',
            }}>
              Status: <strong style={{ textTransform: 'capitalize' }}>{apt.status}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <div style={{ color: 'var(--brand-primary)', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
