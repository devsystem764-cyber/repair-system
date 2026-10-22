'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState({ status: 'all', department: 'all', from: '', to: '' });
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase.from('repair_tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').eq('active', true);
    setDepartments(data || []);
  };

  const filtered = tickets.filter(t => {
    if (filter.status !== 'all' && t.status !== filter.status) return false;
    if (filter.department !== 'all' && t.department !== filter.department) return false;
    if (filter.from && new Date(t.created_at) < new Date(filter.from)) return false;
    if (filter.to && new Date(t.created_at) > new Date(filter.to)) return false;
    return true;
  });

  const exportExcel = () => {
    const data = filtered.map(t => ({
      'เลขที่ใบแจ้งซ่อม': t.ticket_number,
      'ผู้แจ้ง': t.requester_name,
      'แผนก': t.department,
      'หน่วยงาน/ฝ่าย': t.unit,
      'สถานที่': t.location,
      'ประเภทปัญหา': t.issue_type,
      'อุปกรณ์ที่เสีย': t.hardware_failure,
      'อาการ': t.problem_description,
      'สถานะ': t.status,
      'วันที่แจ้ง': new Date(t.created_at).toLocaleString('th-TH')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายงาน');
    XLSX.writeFile(wb, `รายงานการแจ้งซ่อม_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('รายงานการแจ้งซ่อม', 14, 15);
    const rows = filtered.map(t => [t.ticket_number, t.requester_name, t.department, t.unit, t.location, t.issue_type, t.status]);
    (doc as any).autoTable({ head: [['เลขที่', 'ผู้แจ้ง', 'แผนก', 'หน่วยงาน', 'สถานที่', 'ประเภทปัญหา', 'สถานะ']], body: rows, startY: 25 });
    doc.save(`รายงานการแจ้งซ่อม_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (profile?.role !== 'admin' && profile?.role !== 'technician') {
    return <div className="p-8 text-center">ไม่มีสิทธิ์เข้าถึง</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">รายงานการแจ้งซ่อม</h1>
      
      <div className="card p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} className="border rounded-lg p-2">
          <option value="all">ทุกสถานะ</option>
          <option value="pending">รอซ่อม</option>
          <option value="in_progress">กำลังซ่อม</option>
          <option value="resolved">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
        <select value={filter.department} onChange={(e) => setFilter({...filter, department: e.target.value})} className="border rounded-lg p-2">
          <option value="all">ทุกแผนก</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <input type="date" value={filter.from} onChange={(e) => setFilter({...filter, from: e.target.value})} className="border rounded-lg p-2" />
        <input type="date" value={filter.to} onChange={(e) => setFilter({...filter, to: e.target.value})} className="border rounded-lg p-2" />
      </div>

      <div className="flex gap-4">
        <button onClick={exportExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg">Export Excel</button>
        <button onClick={exportPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg">Export PDF</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">เลขที่</th>
              <th className="px-4 py-2 text-left">ผู้แจ้ง</th>
              <th className="px-4 py-2 text-left">แผนก</th>
              <th className="px-4 py-2 text-left">หน่วยงาน</th>
              <th className="px-4 py-2 text-left">สถานที่</th>
              <th className="px-4 py-2 text-left">ประเภทปัญหา</th>
              <th className="px-4 py-2 text-left">สถานะ</th>
              <th className="px-4 py-2 text-left">วันที่แจ้ง</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b">
                <td className="px-4 py-2">{t.ticket_number}</td>
                <td className="px-4 py-2">{t.requester_name}</td>
                <td className="px-4 py-2">{t.department}</td>
                <td className="px-4 py-2">{t.unit}</td>
                <td className="px-4 py-2">{t.location}</td>
                <td className="px-4 py-2">{t.issue_type}</td>
                <td className="px-4 py-2">{t.status}</td>
                <td className="px-4 py-2">{new Date(t.created_at).toLocaleDateString('th-TH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}