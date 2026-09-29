'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { CalendarX2, Scissors, Clock, AlertTriangle, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Appointment } from '@/lib/types';
import { BASE_PRICE } from '@/lib/types';

const STATUS_CONFIG = {
  pending:   { icon: <Clock size={12} />,       css: 'badge-pending',   color: 'var(--status-pending)' },
  completed: { icon: <CheckCircle2 size={12} />, css: 'badge-completed', color: 'var(--status-completed)' },
  'no-show': { icon: <XCircle size={12} />,      css: 'badge-noshow',    color: 'var(--status-noshow)' },
  cancelled: { icon: <MinusCircle size={12} />,  css: 'badge-cancelled', color: 'var(--status-cancelled)' },
};

export default function AppointmentsPage() {
  const t = useTranslations('appointments');
  const tBook = useTranslations('booking');
  const locale = useLocale();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*, haircuts(*)')
      .eq('client_id', user.id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });
    setAppointments(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function cancelAppointment(id: number) {
    setCancelling(id);
    const supabase = createClient();
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    await load();
    setCancelling(null);
  }

  function canCancel(apt: Appointment): boolean {
    const now = new Date();
    const aptDateTime = parseISO(`${apt.date}T${apt.time}`);
    return differenceInMinutes(aptDateTime, now) > 120;
  }

  const upcoming = appointments.filter((a) => a.status === 'pending');
  const past = appointments.filter((a) => a.status !== 'pending');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ padding: '2.5rem 1.25rem' }}>
      <h1 className="section-title">{t('title')}</h1>

      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CalendarX2 size={48} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--text-muted)', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{t('noAppointments')}</p>
          <Link href={`/${locale}/book`} className="btn btn-primary">{t('bookNow')}</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                {t('upcoming')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {upcoming.map((apt) => {
                  const cancellable = canCancel(apt);
                  const haircutName = apt.haircuts
                    ? ((apt.haircuts.name as Record<string, string>)[locale] ?? apt.haircuts.name.en)
                    : apt.haircut_style ?? '—';

                  return (
                    <div key={apt.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-md)',
                            background: 'rgba(201,169,110,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Scissors size={18} style={{ color: 'var(--brand-primary)' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{haircutName}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                              {format(parseISO(apt.date), 'PPP')} · {apt.time.slice(0, 5)}
                            </div>
                            {apt.penalty_applied > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--brand-danger)', marginTop: '0.2rem' }}>
                                Total: ₩{(BASE_PRICE + apt.penalty_applied).toLocaleString()} (incl. ₩{apt.penalty_applied.toLocaleString()} penalty)
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <span className={`badge badge-${apt.status === 'no-show' ? 'noshow' : apt.status}`}>
                            {STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG]?.icon}
                            {t(`status.${apt.status === 'no-show' ? 'noShow' : apt.status}` as Parameters<typeof t>[0])}
                          </span>

                          {cancellable ? (
                            <button
                              onClick={() => cancelAppointment(apt.id)}
                              className="btn btn-danger btn-sm"
                              disabled={cancelling === apt.id}
                            >
                              {cancelling === apt.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : null}
                              {t('cancelBtn')}
                            </button>
                          ) : (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--brand-danger)', maxWidth: 220, lineHeight: 1.4 }}>
                                <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />
                                {t('cancelLateWarning')}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {t('penaltyNote')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('past')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {past.map((apt) => {
                  const haircutName = apt.haircuts
                    ? ((apt.haircuts.name as Record<string, string>)[locale] ?? apt.haircuts.name.en)
                    : apt.haircut_style ?? '—';
                  const statusKey = apt.status === 'no-show' ? 'noShow' : apt.status;

                  return (
                    <div key={apt.id} className="card" style={{ padding: '1rem 1.5rem', opacity: 0.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{haircutName}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {format(parseISO(apt.date), 'PPP')} · {apt.time.slice(0, 5)}
                          </div>
                        </div>
                        <span className={`badge badge-${apt.status === 'no-show' ? 'noshow' : apt.status}`}>
                          {STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG]?.icon}
                          {t(`status.${statusKey}` as Parameters<typeof t>[0])}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
