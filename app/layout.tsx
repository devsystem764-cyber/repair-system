import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/AuthContext';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'ระบบแจ้งซ่อม online สหกรณ์เครดิตยูเนี่ยนคลองจั่น',
  description: 'Repair Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}