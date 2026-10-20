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
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{ticket.ticket_number}</td>
                <td>{ticket.requester_name}</td>
                <td>{ticket.problem_description}</td>
                <td>{ticket.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
