"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0, cancelled: 0 });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
    const channel = supabase
      .channel("tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "repair_tickets" }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase.from("repair_tickets").select("*").order("created_at", { ascending: false });
    setTickets(data || []);
    const pending = data?.filter(t => t.status === "pending").length || 0;
    const inProgress = data?.filter(t => t.status === "in_progress").length || 0;
    const resolved = data?.filter(t => t.status === "resolved").length || 0;
    const cancelled = data?.filter(t => t.status === "cancelled").length || 0;
    setStats({ pending, inProgress, resolved, cancelled });
  };

  const fetchComments = async (ticketId: string) => {
    const { data } = await supabase.from("ticket_comments").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
    setComments(data || []);
  };

  const updateStatus = async (ticketId: string, newStatus: string) => {
    const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "resolved") updateData.resolved_at = new Date().toISOString();
    
    const { error } = await supabase.from("repair_tickets").update(updateData).eq("id", ticketId);
    
    if (error) {
      alert("ไม่สามารถเปลี่ยนสถานะได้: " + error.message);
    } else {
      await supabase.from("ticket_comments").insert({
        ticket_id: ticketId,
        user_id: user?.id,
        user_name: profile?.full_name || user?.email,
        comment: `เปลี่ยนสถานะเป็น: ${getStatusText(newStatus)}`,
      });
      fetchTickets();
    }
  };

  const addComment = async () => {
    if (!comment.trim() || !selectedTicket) return;
    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: selectedTicket.id,
      user_id: user?.id,
      user_name: profile?.full_name || user?.email,
      comment: comment.trim(),
    });
    if (error) alert("เกิดข้อผิดพลาด: " + error.message);
    else {
      setComment("");
      fetchComments(selectedTicket.id);
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "pending": return "รอซ่อม";
      case "in_progress": return "กำลังซ่อม";
      case "resolved": return "เสร็จสิ้น";
      case "cancelled": return "ยกเลิก";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending": return "bg-orange-100 text-orange-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const exportToExcel = () => {
    const exportData = tickets.map(t => ({
      "เลขที่ใบแจ้งซ่อม": t.ticket_number,
      "ผู้แจ้ง": t.requester_name,
      "แผนก": t.department,
      "หน่วยงาน/ฝ่าย": t.unit,
      "สถานที่": t.location,
      "ประเภทปัญหา": t.issue_type,
      "อุปกรณ์/ชิ้นที่เสีย": t.hardware_failure,
      "อาการ": t.problem_description,
      "สถานะ": getStatusText(t.status),
      "วันที่แจ้ง": new Date(t.created_at).toLocaleDateString("th-TH"),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
    XLSX.writeFile(wb, `repair_tickets_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("รายงานการแจ้งซ่อม", 14, 20);
    const tableColumn = ["เลขที่", "ผู้แจ้ง", "แผนก", "สถานที่", "สถานะ"];
    const tableRows = tickets.map(t => [
      t.ticket_number, t.requester_name, t.department, t.location, getStatusText(t.status)
    ]);
    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save(`repair_report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-600">รอซ่อม</h3>
          <p className="text-4xl font-bold text-orange-500">{stats.pending}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-600">กำลังซ่อม</h3>
          <p className="text-4xl font-bold text-blue-500">{stats.inProgress}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-600">เสร็จสิ้น</h3>
          <p className="text-4xl font-bold text-green-500">{stats.resolved}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-600">ยกเลิก</h3>
          <p className="text-4xl font-bold text-red-500">{stats.cancelled}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={exportToExcel} className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">Export Excel</button>
        <button onClick={exportToPDF} className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700">Export PDF</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้แจ้ง</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แผนก/หน่วยงาน</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่แจ้ง</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{ticket.ticket_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ticket.requester_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ticket.department} / {ticket.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ticket.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ticket.issue_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString("th-TH")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => { setSelectedTicket(ticket); fetchComments(ticket.id); }} className="text-blue-600 hover:text-blue-900">รายละเอียด</button>
                  {(profile?.role === "technician" || profile?.role === "admin") && (
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatus(ticket.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border text-sm"
                    >
                      <option value="pending">รอซ่อม</option>
                      <option value="in_progress">กำลังซ่อม</option>
                      <option value="resolved">เสร็จสิ้น</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">รายละเอียดใบแจ้งซ่อม {selectedTicket.ticket_number}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3 mb-6">
              <p><strong>ผู้แจ้ง:</strong> {selectedTicket.requester_name}</p>
              <p><strong>แผนก:</strong> {selectedTicket.department} / {selectedTicket.unit}</p>
              <p><strong>สถานที่:</strong> {selectedTicket.location}</p>
              <p><strong>เบอร์โทรติดต่อ:</strong> {selectedTicket.contact_phone}</p>
              <p><strong>ประเภทปัญหา:</strong> {selectedTicket.issue_type}</p>
              {selectedTicket.hardware_failure && <p><strong>อุปกรณ์/ชิ้นที่เสีย:</strong> {selectedTicket.hardware_failure}</p>}
              <p><strong>อาการ:</strong> {selectedTicket.problem_description}</p>
              {selectedTicket.symptom && <p><strong>รายละเอียด:</strong> {selectedTicket.symptom}</p>}
            </div>
            <div className="border-t pt-4">
              <h4 className="font-bold mb-3">ประวัติการดำเนินการ</h4>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span className="font-medium">{c.user_name}</span>
                      <span>{new Date(c.created_at).toLocaleString("th-TH")}</span>
                    </div>
                    <p className="text-gray-800">{c.comment}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="เพิ่มความคิดเห็น..." className="flex-1 border rounded-lg p-2" />
                <button onClick={addComment} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">ส่ง</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
