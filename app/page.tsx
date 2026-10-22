
'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '../lib/AuthContext';
import TicketForm from '../components/TicketForm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role === 'admin') {
      router.replace('/dashboard');
    }
  }, [profile, loading, router]);

  if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (!user) return <div className="p-8 text-center">กรุณาเข้าสู่ระบบ</div>;
  if (profile?.role === 'admin') return <div className="p-8 text-center">กำลังเปลี่ยนหน้า...</div>;

  return (
    <main className="py-8">
      <TicketForm />
    </main>
  );
}
