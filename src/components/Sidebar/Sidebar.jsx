import { NavLink } from "react-router-dom";
import { useAuth } from "../../AuthContext";

// Componentele tale
import UserProfile from "./UserProfile";
import SidebarComponent from "./SidebarComponent";
import Logo from "./Logo";

// Iconițele (am adăugat LogIn pentru butonul de conectare)
import { LayoutDashboard, BookOpen, ClipboardList, School, Trophy, Terminal, LogIn, Megaphone } from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();

  return (
    // AM CORECTAT AICI: Am transformat NavLink-ul principal într-un <aside>
    <aside className="flex h-full w-full flex-col items-center justify-center border-r border-border bg-sidebar">
      
      {/* Partea de Sus: Logo */}
      <Logo />
      
      {/* Partea de Mijloc: Navigarea Principală */}
      <div className="flex flex-col p-4 text-xs w-full">
        {/* Am adăugat to="/" la Dashboard ca să funcționeze corect ruta */}
        <SidebarComponent name="Dashboard" icon={LayoutDashboard} to="/" />
        <SidebarComponent name="Probleme" icon={Terminal} to="/probleme" />
        <SidebarComponent name="Teorie" icon={BookOpen} to="/teorie" />
        <SidebarComponent name="Clase" icon={School} to="/clase" />
        <SidebarComponent name="Teme" icon={ClipboardList} to="/teme" />
        <SidebarComponent name="Anunțuri" icon={Megaphone} to="/anunturi" />
        <SidebarComponent name="Scoruri" icon={Trophy} to="/scoruri" />
      </div>
      
      {/* Partea de Jos: Autentificare / Profil */}
      <div className="mt-auto border-t border-border w-full">
        {user ? (
          // AM MODIFICAT AICI: Am învelit UserProfile într-un NavLink
          <NavLink 
            to="/profil" 
            className="block w-full hover:bg-sidebar-hover transition-colors cursor-pointer"
          >
            <UserProfile />
          </NavLink>
        ) : (
          <div className="p-4 text-xs w-full">
            <SidebarComponent name="Intră în cont" icon={LogIn} to="/login" />
          </div>
        )}
      </div>

    </aside>
  );
}
