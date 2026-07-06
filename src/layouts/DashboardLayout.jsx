import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';

export default function DashboardLayout() {
  return (
    // Setăm dark mode-ul general, lățimea pe tot ecranul și tăiem scroll-ul general
    <div className="flex h-screen w-full bg-[#1c1c1c] text-white overflow-hidden font-sans">
      
      {/* Meniul din stânga, fix */}
      <Sidebar />
      
      {/* Zona principală unde se vor încărca paginile */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      
    </div>
  );
}