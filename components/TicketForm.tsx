"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { Send } from "lucide-react";

export default function TicketForm() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    requester_name: profile?.full_name || "",
    requester_email: user?.email || "",
    requester_phone: "",
    department: profile?.department || "",
    unit: profile?.unit || "",
    location: "",
    asset_name: "",
    issue_type: "",
    hardware_failure: "",
    symptom: "",
    contact_phone: "",
    problem_description: "",
    priority: "medium",
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [repairItems, setRepairItems] = useState<any[]>([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    const [deptRes, unitRes, itemRes] = await Promise.all([
      supabase.from("departments").select("*").eq("active", true).order("name"),
      supabase.from("units").select("*").eq("active", true).order("name"),
      supabase.from("repair_items").select("*").eq("active", true).order("name"),
    ]);
    setDepartments(deptRes.data || []);
    setUnits(unitRes.data || []);
    setRepairItems(itemRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const imageUrls: string[] = [];
    for (const file of images) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const { data } = await supabase.storage.from("ticket-images").upload(fileName, file);
      if (data) imageUrls.push(data.path);
    }

    const ticketData = {
      ...formData,
      images: imageUrls,
      created_by: user?.id,
      user_id: user?.id,
    };

    const { data, error } = await supabase.from("repair_tickets").insert(ticketData).select().single();

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      alert("ส่งคำขอซ่อมสำเร็จ! เลขที่ใบแจ้งซ่อม: " + data.ticket_number);
      setFormData({
        requester_name: profile?.full_name || "",
        requester_email: user?.email || "",
        requester_phone: "",
        department: profile?.department || "",
        unit: profile?.unit || "",
        location: "",
        asset_name: "",
        issue_type: "",
        hardware_failure: "",
        symptom: "",
        contact_phone: "",
        problem_description: "",
        priority: "medium",
      });
      setImages([]);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto card p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">แบบฟอร์มแจ้งซ่อม</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้แจ้ง *</label>
          <input type="text" required className="w-full border border-gray-300 rounded-lg p-3" 
            value={formData.requester_name} onChange={(e) => setFormData({...formData, requester_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
          <input type="email" className="w-full border border-gray-300 rounded-lg p-3" 
            value={formData.requester_email} onChange={(e) => setFormData({...formData, requester_email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">แผนก *</label>
          <select required className="w-full border border-gray-300 rounded-lg p-3"
            value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
            <option value="">เลือกแผนก</option>
            {departments.map((dept: any) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">หน่วยงาน/ฝ่าย *</label>
          <select required className="w-full border border-gray-300 rounded-lg p-3"
            value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
            <option value="">เลือกหน่วยงาน/ฝ่าย</option>
            {units.map((unit: any) => <option key={unit.id} value={unit.name}>{unit.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่ *</label>
          <input type="text" required className="w-full border border-gray-300 rounded-lg p-3" 
            value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรติดต่อแผนก *</label>
          <input type="text" required className="w-full border border-gray-300 rounded-lg p-3" 
            value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทปัญหา *</label>
          <select required className="w-full border border-gray-300 rounded-lg p-3"
            value={formData.issue_type} onChange={(e) => setFormData({...formData, issue_type: e.target.value})}>
            <option value="">เลือกประเภทปัญหา</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software/การใช้งานระบบ</option>
            <option value="network">Network</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">อุปกรณ์/ชิ้นที่เสีย</label>
          <select className="w-full border border-gray-300 rounded-lg p-3"
            value={formData.hardware_failure} onChange={(e) => setFormData({...formData, hardware_failure: e.target.value})}>
            <option value="">เลือกอุปกรณ์</option>
            {repairItems.filter((item: any) => item.category === "hardware").map((item: any) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </div>
      </div>

      {(formData.issue_type === "software" || formData.issue_type === "network") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด Software/การใช้งานระบบ *</label>
          <textarea required className="w-full border border-gray-300 rounded-lg p-3 h-32" 
            value={formData.symptom} onChange={(e) => setFormData({...formData, symptom: e.target.value})} />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">อาการ *</label>
        <textarea required className="w-full border border-gray-300 rounded-lg p-3 h-32" 
          value={formData.problem_description} onChange={(e) => setFormData({...formData, problem_description: e.target.value})} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">แนบรูปภาพ</label>
        <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files || []))} className="w-full" />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        <Send className="w-5 h-5" /> {loading ? "กำลังส่ง..." : "ส่งคำขอซ่อม"}
      </button>
    </form>
  );
}
