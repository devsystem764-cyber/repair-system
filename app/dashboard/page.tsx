'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../../components/Dashboard';
import { useAuth } from '../../lib/AuthContext';

export default function DashboardPage() {
  const { user, isTechnician, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isTechnician)) {
      router.push('/login');
    }
  }, [user, isTechnician, loading, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  if (!user || !isTechnician) return null;

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard จัดการงานซ่อม</h1>
      <Dashboard />
    </main>
  );
}