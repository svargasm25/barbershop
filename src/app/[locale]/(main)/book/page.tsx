'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateAndDownloadICS } from '@/lib/ics';
import {
  format, addDays, startOfMonth, endOfMonth, eachDayOfInterval,
  isBefore, isToday, isSameDay, startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check, Search, AlertTriangle, CalendarDays } from 'lucide-react';
import type { Haircut, Profile, BlockedSlot } from '@/lib/types';
import { BASE_PRICE } from '@/lib/types';

// Generate 30-min slots from 10:00 to 01:00 (next day = 25 slots)
function generateSlots(): string[] {
  const slots: string[] = [];
  for (let h = 10; h <= 24; h++) {
    const displayH = h > 23 ? h - 24 : h;
    const label = `${String(h === 24 ? 0 : h).padStart(2, '0')}:00`;
    slots.push(label);
    if (h < 24) {
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }
  // Actually: 10:00–01:00 = 10:00,10:30,...,00:00,00:30,01:00 = 31 slots
  const result: string[] = [];
  for (let h = 10; h <= 25; h++) {
    if (h > 25) break;
    const realH = h >= 24 ? h - 24 : h;
    result.push(`${String(realH).padStart(2, '0')}:00`);
    if (h < 25) result.push(`${String(realH).padStart(2, '0')}:30`);
  }
  return result;
}

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
  const [selectedHaircut, setSelectedHaircut] = useState<Haircut | null>(null);
  const [otherText, setOtherText] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [search, setSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [haircuts, setHaircuts] = useState<Haircut[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
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
    supabase.from('haircuts').select('*').eq('active', true).then(({ data }) => setHaircuts(data ?? []));
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

  const filteredHaircuts = haircuts.filter((h) => {
    const name = (h.name as Record<string, string>)[locale] ?? h.name.en ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const penaltyFee = profile?.penalty_fee ?? 0;
  const totalPrice = BASE_PRICE + penaltyFee;

  async function handleConfirm() {
    if (!selectedDate || !selectedTime || !selectedHaircut || !profile) return;
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

    const isOther = (selectedHaircut.name as Record<string, string>).en?.toLowerCase().includes('other');
    const haircutLabel = isOther
      ? (otherText.trim() || 'Other')
      : ((selectedHaircut.name as Record<string, string>)[locale] ?? selectedHaircut.name.en);

    const { error } = await supabase.from('appointments').insert({
      client_id: profile.id,
      haircut_id: selectedHaircut.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime + ':00',
      haircut_style: haircutLabel,
      room_number: roomNumber.trim(),
      penalty_applied: penaltyFee,
    });
    if (!error) {
      // Enviar correo de confirmación si tiene correo
      if (profile.email) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            name: profile.name,
            date: format(selectedDate, 'PPP'),
            time: selectedTime,
            style: haircutLabel,
            roomNumber: roomNumber.trim()
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

      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2.5rem', maxWidth: 480 }}>
        {[1, 2, 3].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : 'none' }}>
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
              {s === 1 ? t('step1') : s === 2 ? t('step2') : t('step3')}
            </span>
            {s < 3 && (
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
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

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

      {/* ── STEP 2: Haircut Style ── */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder={t('searchStyle')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {filteredHaircuts.map((haircut) => {
              const name = (haircut.name as Record<string, string>)[locale] ?? haircut.name.en;
              const desc = haircut.description ? (haircut.description as Record<string, string>)[locale] ?? '' : '';
              const sel = selectedHaircut?.id === haircut.id;
              const isOther = name.toLowerCase().includes('other') || name.includes('기타') || name.includes('Sonstiges') || name.includes('Другое') || name.includes('Autre');
              return (
                <button
                  key={haircut.id}
                  onClick={() => { setSelectedHaircut(haircut); if (!isOther) setOtherText(''); }}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: sel ? '2px solid var(--brand-primary)' : '1px solid var(--surface-border)',
                    background: sel ? 'rgba(212,175,55,0.08)' : 'var(--surface-1)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {sel && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'var(--brand-primary)', borderRadius: '50%',
                      width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={11} color="#111111" />
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.375rem', color: sel ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                </button>
              );
            })}
          </div>

          {/* Other — freeform text input */}
          {selectedHaircut && ((selectedHaircut.name as Record<string, string>).en?.toLowerCase().includes('other') ||
            (selectedHaircut.name as Record<string, string>).ko?.includes('기타')) && (
            <div style={{ marginTop: '1.25rem', maxWidth: 480 }}>
              <label className="label">{t('otherLabel')}</label>
              <input
                className="input"
                placeholder={t('otherPlaceholder')}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={100}
              />
            </div>
          )}

          {/* Room Number Input */}
          <div style={{ marginTop: '1.5rem', maxWidth: 480 }}>
            <label className="label">{t('roomNumberLabel')}</label>
            <input
              className="input"
              placeholder={t('roomNumberPlaceholder')}
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirm ── */}
      {step === 3 && (
        <div className="animate-fade-in" style={{ maxWidth: 520 }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('summary')}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              <SummaryRow label={t('date')} value={selectedDate ? format(selectedDate, 'PPP') : ''} />
              <SummaryRow label={t('time')} value={selectedTime ?? ''} />
              <SummaryRow label={t('style')} value={selectedHaircut ? ((selectedHaircut.name as Record<string, string>)[locale] ?? selectedHaircut.name.en) : ''} />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', maxWidth: 520 }}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
            <ChevronLeft size={16} /> {t('back')}
          </button>
        ) : <div />}
        {step < 3 && (
          <button
            onClick={() => setStep(step + 1)}
            className="btn btn-primary"
            disabled={
              hasPendingAppointment ||
              (step === 1 && (!selectedDate || !selectedTime)) ||
              (step === 2 && (!selectedHaircut ||
                ((selectedHaircut.name as Record<string, string>).en?.toLowerCase().includes('other') && !otherText.trim()) ||
                !roomNumber.trim()))
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
