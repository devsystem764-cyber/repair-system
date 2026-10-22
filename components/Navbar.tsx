'use client';

import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { LogIn, LogOut, User, LayoutDashboard, Users, Settings, FileText, Home, ClipboardList } from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut, loading } = useAuth();

  if (!user) return null;

  const isAdmin = profile?.role === 'admin';
  const isTechnician = profile?.role === 'technician' || profile?.role === 'admin';

  const displayName = profile?.full_name?.trim() || user.user_metadata?.full_name || user.email;

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* ชื่อระบบ */}
        <Link href={isAdmin ? "/dashboard" : "/"} className="text-xl md:text-2xl font-bold text-blue-600 shrink-0">
          🛠️ ระบบแจ้งซ่อม สหกรณ์เครดิตยูเนี่ยนคลองจั่น
        </Link>

        {/* เมนูหลัก */}
        <div className="hidden md:flex items-center gap-2">
          {isAdmin ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
                <LayoutDashboard className="w-4 h-4" />
                <span>แดชบอร์ด</span>
              </Link>
              <Link href="/admin/users" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
                <Users className="w-4 h-4" />
                <span>จัดการสมาชิก</span>
              </Link>
              <Link href="/admin/master-data" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
                <Settings className="w-4 h-4" />
                <span>ข้อมูลหลัก</span>
              </Link>
              <Link href="/reports" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
                <FileText className="w-4 h-4" />
                <span>รายงาน</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
                <Home className="w-4 h-4" />
                <span>แจ้งซ่อม</span>
              </Link>
              {isTechnician && (
                <Link href="/dashboard" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
                  <ClipboardList className="w-4 h-4" />
                  <span>งานซ่อม</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* ปุ่มด้านขวา */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {loading ? (
            <span className="text-sm text-gray-400">กำลังโหลด...</span>
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="max-w-[160px] truncate">{displayName}</span>
                {profile?.role && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {profile.role === 'admin' ? 'ผู้ดูแลระบบ' : profile.role === 'technician' ? 'ช่างซ่อม' : 'ผู้ใช้งาน'}
                  </span>
                )}
              </div>

              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border hover:bg-gray-50"
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
