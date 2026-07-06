import { UNSAFE_mapRouteProperties } from "react-router-dom";
import UserProfile from "./UserProfile";
import SidebarComponent from "./SidebarComponent";
import { LayoutDashboard, BookOpen, Trophy, Settings } from 'lucide-react';
export default function Sidebar() {
  return (
    <div className="h-full flex flex-col">
      <UserProfile></UserProfile>
      <div className="flex flex-col gap-2 mt-4">
        <SidebarComponent name="Dashboard" icon={LayoutDashboard} />
        <SidebarComponent name="Teorie" icon={BookOpen} />
        <SidebarComponent name="Scoruri" icon={Trophy} />
      </div>
      <div className="mt-auto">
        <SidebarComponent name="Setări" icon={Settings} className="mt-2" hasBorder={false}/>

      </div>
    </div>
  );
}