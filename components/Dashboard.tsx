'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, PieChart } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Dashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_tickets' }, 
        () => fetchTickets()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase.from('repair_tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    
    const pending = data?.filter(t => t.status === 'pending').length || 0;
    const inProgress = data?.filter(t => t.status === 'in_progress').length || 0;
    const resolved = data?.filter(t => t.status === 'resolved').length || 0;
    setStats({ pending, inProgress, resolved });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tickets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
    XLSX.writeFile(wb, `repair_tickets_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("รายงานการแจ้งซ่อม", 14, 20);
    
    const tableColumn = ["Ticket No", "Requester", "Problem", "Status", "Priority"];
    const tableRows = tickets.map(t => [
      t.ticket_number, t.requester_name, t.problem_description.substring(0, 50), t.status, t.priority
    ]);

    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save(`repair_report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-xl">Pending</h3>
          <p className="text-5xl font-bold text-orange-500">{stats.pending}</p>
        </div>
        {/* Similar cards for others */}
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={exportToExcel} className="px-6 py-3 bg-green-600 text-white rounded-xl">Export Excel</button>
        <button onClick={exportToPDF} className="px-6 py-3 bg-red-600 text-white rounded-xl">Export PDF</button>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>ผู้แจ้ง</th>
              <th>ปัญหา</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
  {tickets.map((ticket) => (
    <tr key={ticket.id} className="border-b hover:bg-gray-50">
      <td className="py-4 font-medium">{ticket.ticket_number}</td>
      <td className="py-4">{ticket.requester_name}</td>
      <td className="py-4">{ticket.location}</td>
      <td className="py-4">
        <select
          value={ticket.status}
          onChange={async (e) => {
            const newStatus = e.target.value;
            const { error } = await supabase
              .from('repair_tickets')
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
              })
              .eq('id', ticket.id);

            if (error) {
              alert('ไม่สามารถเปลี่ยนสถานะได้: ' + error.message);
            } else {
              // รีโหลดข้อมูล
              const { data } = await supabase
                .from('repair_tickets')
                .select('*')
                .order('created_at', { ascending: false });
              setTickets(data || []);
            }
          }}
          className="px-2 py-1 rounded-lg border text-sm"
        >
          <option value="pending">รอซ่อม</option>
          <option value="in_progress">กำลังซ่อม</option>
          <option value="resolved">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </td>
      <td className="py-4 text-sm text-gray-500">
        {new Date(ticket.created_at).toLocaleDateString('th-TH')}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
}
