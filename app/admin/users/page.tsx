"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/AuthContext";
import { Edit, Key } from "lucide-react";

export default function UserManagementPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editData, setEditData] = useState({ full_name: "", employee_id: "", department: "", unit: "", role: "user" });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update(editData).eq("id", selectedUser.id);
    if (error) alert("เกิดข้อผิดพลาด: " + error.message);
    else {
      alert("แก้ไขสำเร็จ");
      setShowEdit(false);
      fetchUsers();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, password: newPassword }),
    });
    const data = await res.json();
    if (data.error) alert("เกิดข้อผิดพลาด: " + data.error);
    else {
      alert("เปลี่ยนรหัสผ่านสำเร็จ");
      setShowPassword(false);
      setNewPassword("");
    }
  };

  if (profile?.role !== "admin") {
    return <div className="p-8 text-center">ไม่มีสิทธิ์เข้าถึง</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">จัดการผู้ใช้งาน</h1>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">ชื่อ-นามสกุล</th>
              <th className="px-6 py-3 text-left">รหัสพนักงาน</th>
              <th className="px-6 py-3 text-left">แผนก</th>
              <th className="px-6 py-3 text-left">หน่วยงาน/ฝ่าย</th>
              <th className="px-6 py-3 text-left">สิทธิ์</th>
              <th className="px-6 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-6 py-4">{user.full_name}</td>
                <td className="px-6 py-4">{user.employee_id}</td>
                <td className="px-6 py-4">{user.department}</td>
                <td className="px-6 py-4">{user.unit}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setSelectedUser(user); setEditData({ full_name: user.full_name || "", employee_id: user.employee_id || "", department: user.department || "", unit: user.unit || "", role: user.role || "user" }); setShowEdit(true); }} className="text-blue-600"><Edit className="w-4 h-4 inline" /></button>
                  <button onClick={() => { setSelectedUser(user); setShowPassword(true); }} className="text-orange-600"><Key className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">แก้ไขผู้ใช้งาน</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <input type="text" placeholder="ชื่อ-นามสกุล" value={editData.full_name} onChange={(e) => setEditData({...editData, full_name: e.target.value})} className="w-full border rounded-lg p-2" />
              <input type="text" placeholder="รหัสพนักงาน" value={editData.employee_id} onChange={(e) => setEditData({...editData, employee_id: e.target.value})} className="w-full border rounded-lg p-2" />
              <input type="text" placeholder="แผนก" value={editData.department} onChange={(e) => setEditData({...editData, department: e.target.value})} className="w-full border rounded-lg p-2" />
              <input type="text" placeholder="หน่วยงาน/ฝ่าย" value={editData.unit} onChange={(e) => setEditData({...editData, unit: e.target.value})} className="w-full border rounded-lg p-2" />
              <select value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})} className="w-full border rounded-lg p-2">
                <option value="user">User</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg">บันทึก</button>
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 bg-gray-300 py-2 rounded-lg">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">เปลี่ยนรหัสผ่าน</h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input type="password" placeholder="รหัสผ่านใหม่" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded-lg p-2" />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg">เปลี่ยนรหัสผ่าน</button>
                <button type="button" onClick={() => setShowPassword(false)} className="flex-1 bg-gray-300 py-2 rounded-lg">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
