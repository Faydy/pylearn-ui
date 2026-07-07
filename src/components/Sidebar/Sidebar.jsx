import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Asigură-te că drumul e corect
import { NavLink } from "react-router-dom";

// Componentele tale
import UserProfile from "./UserProfile";
import SidebarComponent from "./SidebarComponent";
import Logo from "./Logo";

// Iconițele (am adăugat LogIn pentru butonul de conectare)
import { LayoutDashboard, BookOpen, Trophy, Settings, Terminal, LogIn } from 'lucide-react';

export default function Sidebar() {
  // 1. Definim starea care ține minte dacă e logat sau nu
  const [session, setSession] = useState(null);

  // 2. Verificăm sesiunea direct din Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    // AM CORECTAT AICI: Am transformat NavLink-ul principal într-un <aside>
    <aside className="h-full dark:bg-sidebar border-r border-border flex flex-col items-center justify-center w-full">
      
      {/* Partea de Sus: Logo */}
      <Logo />
      
      {/* Partea de Mijloc: Navigarea Principală */}
      <div className="flex flex-col p-4 text-xs w-full">
        {/* Am adăugat to="/" la Dashboard ca să funcționeze corect ruta */}
        <SidebarComponent name="Dashboard" icon={LayoutDashboard} to="/" />
        <SidebarComponent name="Probleme" icon={Terminal} to="/probleme" />
        <SidebarComponent name="Teorie" icon={BookOpen} to="/teorie" />
        <SidebarComponent name="Scoruri" icon={Trophy} to="/scoruri" />
      </div>
      
      {/* Partea de Jos: Autentificare / Profil */}
      <div className="mt-auto border-t border-border w-full">
        {session ? (
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