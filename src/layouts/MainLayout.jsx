import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import MobileNavigation from "../components/Sidebar/MobileNavigation";
import Sidebar from "../components/Sidebar/Sidebar";

export default function MainLayout() {
  const { pathname } = useLocation();
  const showFooter = !/^\/rezolvare\/[^/]+$/.test(pathname);

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-background font-sans text-text-main lg:h-dvh lg:flex-row">
      <div className="hidden w-64 flex-shrink-0 lg:block">
        <Sidebar />
      </div>
      <MobileNavigation />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {showFooter ? (
          <div className="flex min-h-full flex-col">
            <div className="min-h-0 flex-1">
              <Outlet />
            </div>
            <div className="mt-6">
              <Footer />
            </div>
          </div>
        ) : <Outlet />}
      </div>
      
    </div>
  );
}
