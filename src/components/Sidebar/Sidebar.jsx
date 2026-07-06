import UserProfile from "./UserProfile";
import SidebarComponent from "./SidebarComponent";
import { LayoutDashboard, BookOpen, Trophy, Settings, Terminal } from 'lucide-react';
import Logo from "./Logo";
export default function Sidebar() {
  return (
    <div className="h-full dark:bg-sidebar border-r-1 border-border flex flex-col items-center justify-center">
        <Logo />
      <div className="flex flex-col p-4 text-xs w-full">
        <SidebarComponent name="Dashboard" icon={LayoutDashboard} />
        <SidebarComponent name="Probleme" icon={Terminal} to="/probleme" />
        <SidebarComponent name="Teorie" icon={BookOpen} to="/teorie" />
        <SidebarComponent name="Scoruri" icon={Trophy} to="/scoruri" />
      </div>
      <div className="mt-auto border-t border-border">
        <UserProfile/>
      </div>
    </div>
  );
}