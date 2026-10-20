'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Send } from 'lucide-react';

export default function TicketForm() {
  const [formData, setFormData] = useState({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    department: '',
    location: '',
    asset_name: '',
    problem_description: '',
    priority: 'medium',
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Upload images
    const imageUrls: string[] = [];
    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data } = await supabase.storage
        .from('ticket-images')
        .upload(fileName, file);
      if (data) imageUrls.push(data.path);
    }

    const { error } = await supabase.from('repair_tickets').insert({
      ...formData,
      images: imageUrls,
    });

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('ส่งคำขอซ่อมสำเร็จ! ขอบคุณ');
      setFormData({ ...formData, problem_description: '' /* reset others */ });
      setImages([]);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto card p-8 space-y-6">
      {/* Form fields here - simplified for demo */}
      <div>
        <label>ชื่อผู้แจ้ง</label>
        <input type="text" required className="w-full border rounded-lg p-3" 
          value={formData.requester_name} onChange={(e) => setFormData({...formData, requester_name: e.target.value})} />
      </div>
      {/* Add more fields similarly */}
      <div>
        <label>รายละเอียดปัญหา</label>
        <textarea required className="w-full border rounded-lg p-3 h-32" 
          value={formData.problem_description} onChange={(e) => setFormData({...formData, problem_description: e.target.value})} />
      </div>
      <div>
        <label>แนบรูปภาพ</label>
        <input type="file" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} className="w-full" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-2">
        <Send className="w-5 h-5" /> ส่งคำขอซ่อม
      </button>
    </form>
  );
}
