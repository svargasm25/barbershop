import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Mail, GraduationCap, Home, AlertTriangle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'client') {
    redirect(`/${locale}`);
  }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--brand-primary)' }}>
        Mi Perfil
      </h1>

      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{profile.name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Cliente</p>
            </div>
          </div>
          
          <div className="divider" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Email</p>
              <p style={{ fontWeight: 600 }}>{profile.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Curso Universitario</p>
              <p style={{ fontWeight: 600 }}>{profile.university_grade || 'No especificado'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Residente del Dorm</p>
              <p style={{ fontWeight: 600 }}>{profile.dorm_resident ? 'Sí' : 'No'}</p>
            </div>
          </div>

          {profile.penalty_fee > 0 && (
            <>
              <div className="divider" style={{ marginTop: '1rem' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem', background: 'rgba(224,85,85,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(224,85,85,0.2)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--brand-danger)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--brand-danger)' }}>Multa Pendiente</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--brand-danger)', marginTop: '0.375rem', lineHeight: 1.5 }}>
                    Tienes una multa pendiente de ₩{profile.penalty_fee.toLocaleString()} por no presentarte a una cita pasada. Este recargo se sumará al total de tu próxima reserva.
                  </p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
