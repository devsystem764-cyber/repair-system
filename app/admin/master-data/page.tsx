"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/AuthContext";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function MasterDataPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("departments");
  const [departments, setDepartments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [repairItems, setRepairItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", department_id: "", category: "hardware" });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [deptRes, unitRes, itemRes] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("units").select("*, departments(name)").order("name"),
      supabase.from("repair_items").select("*").order("name"),
    ]);
    setDepartments(deptRes.data || []);
    setUnits(unitRes.data || []);
    setRepairItems(itemRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "departments") {
      if (editId) {
        await supabase.from("departments").update({ name: formData.name }).eq("id", editId);
      } else {
        await supabase.from("departments").insert({ name: formData.name });
      }
    } else if (activeTab === "units") {
      if (editId) {
        await supabase.from("units").update({ name: formData.name, department_id: formData.department_id }).eq("id", editId);
      } else {
        await supabase.from("units").insert({ name: formData.name, department_id: formData.department_id });
      }
    } else if (activeTab === "repair_items") {
      if (editId) {
        await supabase.from("repair_items").update({ name: formData.name, category: formData.category }).eq("id", editId);
      } else {
        await supabase.from("repair_items").insert({ name: formData.name, category: formData.category });
      }
    }
    setShowForm(false);
    setEditId(null);
    setFormData({ name: "", department_id: "", category: "hardware" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ?")) return;
    if (activeTab === "departments") await supabase.from("departments").delete().eq("id", id);
    else if (activeTab === "units") await supabase.from("units").delete().eq("id", id);
    else if (activeTab === "repair_items") await supabase.from("repair_items").delete().eq("id", id);
    fetchData();
  };

  if (profile?.role !== "admin") {
    return <div className="p-8 text-center">ไม่มีสิทธิ์เข้าถึง</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">จัดการข้อมูลหลัก</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setFormData({ name: "", department_id: "", category: "hardware" }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> เพิ่มข้อมูล
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab("departments")} className={`px-4 py-2 rounded-lg ${activeTab === "departments" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>แผนก</button>
        <button onClick={() => setActiveTab("units")} className={`px-4 py-2 rounded-lg ${activeTab === "units" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>หน่วยงาน/ฝ่าย</button>
        <button onClick={() => setActiveTab("repair_items")} className={`px-4 py-2 rounded-lg ${activeTab === "repair_items" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>รายการอุปกรณ์</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">ชื่อ</th>
              {activeTab === "units" && <th className="px-6 py-3 text-left">แผนก</th>}
              {activeTab === "repair_items" && <th className="px-6 py-3 text-left">หมวดหมู่</th>}
              <th className="px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === "departments" && departments.map((dept) => (
              <tr key={dept.id} className="border-b">
                <td className="px-6 py-4">{dept.name}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditId(dept.id); setFormData({ name: dept.name, department_id: "", category: "hardware" }); setShowForm(true); }} className="text-blue-600"><Edit className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(dept.id)} className="text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
            {activeTab === "units" && units.map((unit) => (
              <tr key={unit.id} className="border-b">
                <td className="px-6 py-4">{unit.name}</td>
                <td className="px-6 py-4">{unit.departments?.name}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditId(unit.id); setFormData({ name: unit.name, department_id: unit.department_id, category: "hardware" }); setShowForm(true); }} className="text-blue-600"><Edit className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(unit.id)} className="text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
            {activeTab === "repair_items" && repairItems.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="px-6 py-4">{item.name}</td>
                <td className="px-6 py-4">{item.category}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditId(item.id); setFormData({ name: item.name, department_id: "", category: item.category }); setShowForm(true); }} className="text-blue-600"><Edit className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editId ? "แก้ไข" : "เพิ่ม"}ข้อมูล</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อ</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              {activeTab === "units" && (
                <div>
                  <label className="block text-sm font-medium mb-1">แผนก</label>
                  <select required value={formData.department_id} onChange={(e) => setFormData({...formData, department_id: e.target.value})} className="w-full border rounded-lg p-2">
                    <option value="">เลือกแผนก</option>
                    {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                </div>
              )}
              {activeTab === "repair_items" && (
                <div>
                  <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg p-2">
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="network">Network</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">บันทึก</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
