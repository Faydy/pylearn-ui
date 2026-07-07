import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import { useState, useEffect } from "react";

export default function MainLayout() {
    const [isDark, setIsDark] = useState(true);

  return (
    <div className="flex h-screen w-full bg-[#fff] text-gray-700 dark:bg-background dark:text-text-main overflow-hidden font-sans">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      
    </div>
  );
}