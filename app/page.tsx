import TicketForm from '../components/TicketForm';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600">🛠️ ระบบแจ้งซ่อม</h1>
          <div className="text-sm text-gray-500">Real-time Dashboard</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* ฟอร์มแจ้งซ่อม */}
          <div className="xl:col-span-2">
            <div className="sticky top-24">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2">แจ้งปัญหา / ขอซ่อม</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">กรอกข้อมูลด้านล่างเพื่อแจ้งซ่อม</p>
              <TicketForm />
            </div>
          </div>

          {/* Dashboard */}
          <div className="xl:col-span-3">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">Dashboard สถานะ Real-time</h2>
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  );
}
