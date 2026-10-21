'use client';

import TicketForm from '../components/TicketForm';

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">แจ้งปัญหา / ขอซ่อม</h2>
        <p className="text-gray-600">
          กรอกข้อมูลด้านล่างเพื่อแจ้งซ่อม (ไม่จำเป็นต้อง Login)
        </p>
      </div>
      <TicketForm />
    </main>
  );
}