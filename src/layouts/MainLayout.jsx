import { Outlet } from "react-router-dom";
import MobileNavigation from "../components/Sidebar/MobileNavigation";
import Sidebar from "../components/Sidebar/Sidebar";

export default function MainLayout() {
  return (
    <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-background font-sans text-text-main lg:h-dvh lg:flex-row">
      <div className="hidden w-64 flex-shrink-0 lg:block">
        <Sidebar />
      </div>
      <MobileNavigation />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      
    </div>
  );
}
