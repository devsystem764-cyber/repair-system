'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          : error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      if (password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error.message);
      } else {
        setMessage('สมัครสำเร็จ! ลองเข้าสู่ระบบได้เลย');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">🛠️ ระบบแจ้งซ่อม</h1>
          <p className="text-gray-500">
            {isLogin ? 'เข้าสู่ระบบเพื่อจัดการงานซ่อม' : 'สร้างบัญชีใหม่'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อ-นามสกุล</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อของคุณ"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
          )}
          {message && (
            <div className="p-3 rounded-xl bg-green-50 text-green-600 text-sm">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'กำลังดำเนินการ...' : isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          {isLogin ? (
            <p className="text-gray-500">
              ยังไม่มีบัญชี?{' '}
              <button onClick={() => { setIsLogin(false); setError(''); }} className="text-blue-600 hover:underline font-medium">
                สมัครสมาชิก
              </button>
            </p>
          ) : (
            <p className="text-gray-500">
              มีบัญชีแล้ว?{' '}
              <button onClick={() => { setIsLogin(true); setError(''); }} className="text-blue-600 hover:underline font-medium">
                เข้าสู่ระบบ
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}