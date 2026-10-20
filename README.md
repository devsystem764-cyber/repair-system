# ระบบแจ้งซ่อม + Dashboard (Next.js + Supabase)

## วิธี Deploy ขึ้น Vercel (แนะนำ)

### 1. เตรียมโปรเจกต์ให้พร้อม
- ไฟล์ทั้งหมดอยู่ในโฟลเดอร์นี้แล้ว
- ต้องมี GitHub account

### 2. อัปโหลดโค้ดขึ้น GitHub
```bash
# ในโฟลเดอร์โปรเจกต์
git init
git add .
git commit -m "Initial commit - Repair System"
git branch -M main
# สร้าง repo ใหม่บน GitHub แล้ว
git remote add origin https://github.com/YOUR_USERNAME/repair-system.git
git push -u origin main
```

### 3. Deploy บน Vercel
1. ไปที่ https://vercel.com → Login ด้วย GitHub
2. กด **Add New... → Project**
3. เลือก Repository `repair-system`
4. กด **Import**
5. ในส่วน **Environment Variables** เพิ่ม 2 ตัวนี้:
   - `NEXT_PUBLIC_SUPABASE_URL` = ค่าจาก Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ค่าจาก Supabase
6. กด **Deploy**

### 4. หลัง Deploy สำเร็จ
- ไปที่ Supabase → Authentication → URL Configuration
- ใส่ Site URL เป็น `https://your-project.vercel.app`
- เพิ่ม Redirect URLs ตามต้องการ

## ตั้งค่า Supabase ก่อน Deploy
1. สร้าง Project ที่ https://supabase.com
2. ไปที่ SQL Editor → วางโค้ดจาก `repair_system_schema.sql` → Run
3. เปิด Realtime สำหรับตาราง `repair_tickets`
4. สร้าง Storage Bucket ชื่อ `ticket-images` (ตั้งเป็น Public ถ้าต้องการ)
5. คัดลอก Project URL และ anon key จาก Settings → API

## รันในเครื่อง (Local)
```bash
npm install
# สร้างไฟล์ .env.local ตาม .env.example
npm run dev
```
