import { Header } from '@/components/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100dvh - 64px)', paddingBottom: '3rem' }}>
        {children}
      </main>
    </>
  );
}
