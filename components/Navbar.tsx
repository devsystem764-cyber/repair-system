'use client';

import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { LogIn, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut, loading, isTechnician } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl md:text-3xl font-bold text-blue-600">
          🛠️ ระบบแจ้งซ่อม
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          {loading ? (
            <span className="text-sm text-gray-400">กำลังโหลด...</span>
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="w-4 h-4" />
                <span>{profile?.full_name || user.email}</span>
                {profile?.role && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {profile.role === 'admin' ? 'Admin' : profile.role === 'technician' ? 'ช่าง' : 'ผู้ใช้'}
                  </span>
                )}
              </div>
              {isTechnician && (
                <Link
                  href="/dashboard"
                  className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}