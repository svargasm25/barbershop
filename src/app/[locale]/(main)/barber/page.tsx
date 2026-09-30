'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO, isToday } from 'date-fns';
import {
  Scissors, Users, DollarSign, Lock, Unlock, ChevronRight,
  CalendarDays, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import Link from 'next/link';
import type { Appointment, BlockedSlot, Profile } from '@/lib/types';
import { BASE_PRICE, PENALTY_FEE } from '@/lib/types';

const ALL_SLOTS = [
  '10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30',
  '22:00','22:30','23:00','23:30','00:00','00:30','01:00',
];

export default function BarberDashboard() {
  const t = useTranslations('barber');
  const locale = useLocale();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState<(Appointment & { profiles?: Profile })[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockingSlot, setBlockingSlot] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data: apts } = await supabase
      .from('appointments')
      .select('*, profiles(*)')
      .eq('date', selectedDate)
      .in('status', ['pending', 'completed', 'no-show'])
      .order('time');
    const { data: blocked } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('date', selectedDate);
    setAppointments(apts ?? []);
    setBlockedSlots(blocked ?? []);
    setLoading(false);
  }

  useEffect(() => { setLoading(true); load(); }, [selectedDate]);

  async function toggleBlock(slot: string) {
    const supabase = createClient();
    const existing = blockedSlots.find((b) => b.time.slice(0, 5) === slot);
    if (existing) {
      await supabase.from('blocked_slots').delete().eq('id', existing.id);
    } else {
      await supabase.from('blocked_slots').insert({
        date: selectedDate,
        time: slot + ':00',
        reason: blockReason || null,
      });
    }
    setBlockReason('');
    load();
  }

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const expectedRevenue = appointments
    .filter((a) => a.status === 'pending')
    .reduce((sum, a) => sum + BASE_PRICE + (a.penalty_applied ?? 0), 0);

  const isBlocked = (slot: string) => blockedSlots.some((b) => b.time.slice(0, 5) === slot);
  const getAptForSlot = (slot: string) => appointments.find((a) => a.time.slice(0, 5) === slot);

  return (
    <div className="page-container animate-fade-in" style={{ padding: '2.5rem 1.25rem' }}>
      <h1 className="section-title">{t('dashboard')}</h1>

      {/* Date picker + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Date selector */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <CalendarDays size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="label" style={{ marginBottom: '0.25rem' }}>Date</div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <StatCard icon={<Users size={20} />} label={t('totalToday')} value={String(pendingCount)} color="var(--brand-primary)" />
        <StatCard icon={<DollarSign size={20} />} label={t('revenue')} value={`₩${expectedRevenue.toLocaleString()}`} color="#5bb876" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Appointment list */}
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {format(parseISO(selectedDate), 'PPP')} {isToday(parseISO(selectedDate)) ? '(Today)' : ''}
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <span className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
              <Scissors size={36} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
              <p>{t('noAppointmentsToday')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {appointments.map((apt) => {
                const client = apt.profiles;
                const total = BASE_PRICE + (apt.penalty_applied ?? 0);
                const statusIcon = apt.status === 'completed'
                  ? <CheckCircle2 size={14} style={{ color: 'var(--status-completed)' }} />
                  : apt.status === 'no-show'
                  ? <XCircle size={14} style={{ color: 'var(--status-noshow)' }} />
                  : <Clock size={14} style={{ color: 'var(--status-pending)' }} />;

                return (
                  <Link
                    key={apt.id}
                    href={`/${locale}/barber/appointments/${apt.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="card card-interactive" style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                          {/* Time badge */}
                          <div style={{
                            minWidth: 56, textAlign: 'center',
                            padding: '0.4rem 0.5rem',
                            background: 'rgba(201,169,110,0.1)',
                            borderRadius: 'var(--radius-sm)',
                          }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                              {apt.time.slice(0, 5)}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontWeight: 700 }}>{client?.name ?? 'Unknown'}</div>
                            {(apt.room_number || client?.room_number) && (
                              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>🏠 Room {apt.room_number || client?.room_number}</div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {statusIcon}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {apt.status}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--brand-primary)' }}>
                            ₩{total.toLocaleString()}
                          </div>
                          {apt.penalty_applied > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--brand-danger)' }}>
                              +₩{apt.penalty_applied.toLocaleString()} penalty
                            </div>
                          )}
                          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Block slots sidebar */}
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: 80 }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9375rem' }}>
            <Lock size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--brand-primary)' }} />
            {t('blockSlot')}
          </h3>

          <input
            className="input"
            placeholder={t('blockReason')}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            style={{ marginBottom: '1rem', fontSize: '0.875rem' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 400, overflowY: 'auto' }}>
            {ALL_SLOTS.map((slot) => {
              const blocked = isBlocked(slot);
              const apt = getAptForSlot(slot);
              return (
                <div
                  key={slot}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: apt ? 'rgba(201,169,110,0.08)' : blocked ? 'rgba(224,85,85,0.08)' : 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${blocked ? 'rgba(224,85,85,0.2)' : 'transparent'}`,
                  }}
                >
                  <span style={{
                    fontSize: '0.8125rem', fontWeight: 600,
                    color: apt ? 'var(--brand-primary)' : blocked ? 'var(--brand-danger)' : 'var(--text-secondary)',
                  }}>
                    {slot} {apt ? '●' : ''}
                  </span>

                  {!apt && (
                    <button
                      onClick={() => toggleBlock(slot)}
                      className={`btn btn-sm ${blocked ? 'btn-secondary' : 'btn-danger'}`}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}
                    >
                      {blocked ? (
                        <><Unlock size={10} /> {t('unblockBtn')}</>
                      ) : (
                        <><Lock size={10} /> {t('blockBtn')}</>
                      )}
                    </button>
                  )}
                  {apt && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>booked</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{
        width: 44, height: 44,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <div>
        <div className="label" style={{ marginBottom: '0.1rem' }}>{label}</div>
        <div style={{ fontSize: '1.375rem', fontWeight: 800, color }}>{value}</div>
      </div>
    </div>
  );
}
