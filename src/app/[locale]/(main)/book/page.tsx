'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  format, addDays, startOfMonth, endOfMonth, eachDayOfInterval,
  isBefore, isToday, isSameDay, startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check, AlertTriangle, CalendarDays } from 'lucide-react';
import type { Profile, BlockedSlot } from '@/lib/types';
import { BASE_PRICE } from '@/lib/types';

const ALL_SLOTS = [
  '10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30',
  '22:00','22:30','23:00','23:30','00:00','00:30','01:00',
];

export default function BookPage() {
  const t = useTranslations('booking');
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [hasPendingAppointment, setHasPendingAppointment] = useState(false);
  const [bookError, setBookError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push(`/${locale}/login`); return; }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p);

      // Check for existing pending appointment
      const { data: pending } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .limit(1);
      if (pending && pending.length > 0) setHasPendingAppointment(true);
    });
    supabase.from('blocked_slots').select('*').then(({ data }) => setBlockedSlots(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const supabase = createClient();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    supabase
      .from('appointments')
      .select('time')
      .eq('date', dateStr)
      .in('status', ['pending', 'completed'])
      .then(({ data }) => setBookedSlots((data ?? []).map((r) => (r.time as string).slice(0, 5))));
  }, [selectedDate]);

  function isSlotUnavailable(slot: string): boolean {
    if (!selectedDate) return false;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (bookedSlots.includes(slot)) return true;
    return blockedSlots.some((b) => b.date === dateStr && b.time.slice(0, 5) === slot);
  }

  const penaltyFee = profile?.penalty_fee ?? 0;
  const totalPrice = BASE_PRICE + penaltyFee;

  async function handleConfirm() {
    if (!selectedDate || !selectedTime || !profile) return;
    if (hasPendingAppointment) return;
    setConfirming(true);
    setBookError('');
    const supabase = createClient();

    // Double-check at submit time (race condition guard)
    const { data: pending } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', profile.id)
      .eq('status', 'pending')
      .limit(1);
    if (pending && pending.length > 0) {
      setHasPendingAppointment(true);
      setConfirming(false);
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      client_id: profile.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime + ':00',
      room_number: profile.room_number ?? '',
      penalty_applied: penaltyFee,
    });
    if (!error) {
      // Send confirmation email if user has email
      if (profile.email) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            name: profile.name,
            date: format(selectedDate, 'PPP'),
            time: selectedTime,
            roomNumber: profile.room_number ?? ''
          })
        }).catch(err => console.error('Failed to send email:', err));
      }
      
      setDone(true);
    } else {
      // DB unique constraint violation (code 23505) means duplicate pending
      if (error.code === '23505') {
        setHasPendingAppointment(true);
      } else {
        setBookError(error.message);
      }
    }
    setConfirming(false);
  }

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay(); // 0=Sun

  if (done) {
    return (
      <div className="page-container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <div className="animate-fade-in" style={{
          maxWidth: 480, margin: '0 auto',
          background: 'var(--surface-1)', borderRadius: 'var(--radius-xl)',
          padding: '3rem 2rem', border: '1px solid var(--surface-border)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('success')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {format(selectedDate!, 'PPP')} · {selectedTime}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            📅 {t('calendarNote')}
          </p>
          <button
            onClick={() => router.push(`/${locale}/appointments`)}
            className="btn btn-primary btn-lg"
          >
            {t('step1')} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ padding: '2.5rem 1.25rem' }}>
      <h1 className="section-title">{t('title')}</h1>

      {/* Pending appointment block */}
      {hasPendingAppointment && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.25)',
          borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', maxWidth: 600,
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--brand-danger)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, color: 'var(--brand-danger)', marginBottom: '0.25rem' }}>
              {t('pendingBlock')}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {t('pendingBlockDesc')}
            </p>
            <button
              onClick={() => router.push(`/${locale}/appointments`)}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem' }}
            >
              {t('viewAppointments')}
            </button>
          </div>
        </div>
      )}

      {bookError && (
        <div style={{
          padding: '0.75rem 1rem', background: 'rgba(224,85,85,0.08)',
          border: '1px solid rgba(224,85,85,0.2)', borderRadius: 'var(--radius-md)',
          color: 'var(--brand-danger)', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: 600,
        }}>
          {bookError}
        </div>
      )}

      {/* Progress indicator — 2 steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2.5rem', width: '100%', maxWidth: 400 }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 2 ? 1 : 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: step >= s ? 'var(--brand-primary)' : 'var(--surface-3)',
              color: step >= s ? '#1a1400' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8125rem', fontWeight: 700,
              transition: 'all 0.3s',
            }}>
              {step > s ? <Check size={14} /> : s}
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: 500,
              color: step >= s ? 'var(--brand-primary)' : 'var(--text-muted)',
              marginLeft: '0.4rem',
              whiteSpace: 'nowrap',
            }}>
              {s === 1 ? t('step1') : t('step2')}
            </span>
            {s < 2 && (
              <div style={{
                flex: 1, height: 2,
                background: step > s ? 'var(--brand-primary)' : 'var(--surface-3)',
                margin: '0 0.75rem',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Date & Time ── */}
      {step === 1 && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>

          {/* Calendar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <button onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} className="btn btn-secondary btn-sm">
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} className="btn btn-secondary btn-sm">
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-muted)', padding: '0.25rem 0', fontWeight: 600 }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array(startDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {days.map((day) => {
                const past = isBefore(day, startOfDay(new Date())) && !isToday(day);
                const sel = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { if (!past) { setSelectedDate(day); setSelectedTime(null); } }}
                    disabled={past}
                    style={{
                      padding: '0.4rem',
                      borderRadius: 8,
                      border: isToday(day) ? '1px solid var(--brand-primary)' : '1px solid transparent',
                      background: sel ? 'var(--brand-primary)' : 'transparent',
                      color: past ? 'var(--text-muted)' : sel ? '#1a1400' : 'var(--text-primary)',
                      cursor: past ? 'not-allowed' : 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: sel ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              {selectedDate ? format(selectedDate, 'PPP') : t('selectDate')}
            </h3>
            {selectedDate ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', maxHeight: 360, overflowY: 'auto' }}>
                {ALL_SLOTS.map((slot) => {
                  const unavail = isSlotUnavailable(slot);
                  const sel = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => { if (!unavail) setSelectedTime(slot); }}
                      disabled={unavail}
                      style={{
                        padding: '0.5rem 0.25rem',
                        borderRadius: 'var(--radius-sm)',
                        border: sel ? '1.5px solid var(--brand-primary)' : '1px solid var(--surface-border)',
                        background: unavail ? 'var(--surface-2)' : sel ? 'rgba(201,169,110,0.15)' : 'var(--surface-2)',
                        color: unavail ? 'var(--text-muted)' : sel ? 'var(--brand-primary)' : 'var(--text-primary)',
                        cursor: unavail ? 'not-allowed' : 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: sel ? 700 : 400,
                        textDecoration: unavail ? 'line-through' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                <CalendarDays size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>{t('selectDate')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Confirm ── */}
      {step === 2 && (
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('summary')}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              <SummaryRow label={t('date')} value={selectedDate ? format(selectedDate, 'PPP') : ''} />
              <SummaryRow label={t('time')} value={selectedTime ?? ''} />
              <div className="divider" />
              <SummaryRow label={t('basePrice')} value={`₩${BASE_PRICE.toLocaleString()}`} />
              {penaltyFee > 0 && (
                <SummaryRow label={t('penaltyFee')} value={`₩${penaltyFee.toLocaleString()}`} danger />
              )}
              <SummaryRow label={t('total')} value={`₩${totalPrice.toLocaleString()}`} bold />
            </div>

            {penaltyFee > 0 && (
              <div style={{
                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                padding: '0.875rem',
                background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)',
                borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
              }}>
                <AlertTriangle size={16} style={{ color: 'var(--brand-danger)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--brand-danger)', lineHeight: 1.5 }}>
                  {t('penaltyWarning')}
                </p>
              </div>
            )}

            <button
              onClick={handleConfirm}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={confirming}
            >
              {confirming ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {t('confirmBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', width: '100%', maxWidth: 600, margin: '2rem auto 0' }}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
            <ChevronLeft size={16} /> <span className="hidden-mobile" style={{ marginLeft: 4 }}>{t('back')}</span>
          </button>
        ) : <div />}
        {step < 2 && (
          <button
            onClick={() => setStep(step + 1)}
            className="btn btn-primary"
            disabled={
              hasPendingAppointment ||
              (step === 1 && (!selectedDate || !selectedTime))
            }
          >
            {t('next')} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold, danger }: { label: string; value: string; bold?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        fontSize: bold ? '1rem' : '0.9375rem',
        fontWeight: bold ? 800 : 500,
        color: danger ? 'var(--brand-danger)' : bold ? 'var(--brand-primary)' : 'var(--text-primary)',
      }}>
        {value}
      </span>
    </div>
  );
}
