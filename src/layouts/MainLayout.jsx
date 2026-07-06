import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import { useState, useEffect } from "react";

export default function MainLayout() {
    const [isDark, setIsDark] = useState(true);

  // 2. Când butonul este apăsat (isDark se schimbă), actualizăm HTML-ul
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  return (
    <div className="flex h-screen w-full bg-[#fff] text-gray-700 dark:bg-background dark:text-text-main overflow-hidden font-sans">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <button 
        onClick={() => setIsDark(!isDark)}
        className="absolute bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg font-bold transition-all z-50"
      >
        {isDark ? '☀️ Trece pe Light' : '🌙 Trece pe Dark'}
      </button>
    </div>
  );
}