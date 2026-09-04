import { BookOpen, ClipboardList, LayoutDashboard, LogIn, Megaphone, School, Terminal, Trophy, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const navigationItems = [
  { label: 'Acasă', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Probleme', to: '/probleme', icon: Terminal },
  { label: 'Teorie', to: '/teorie', icon: BookOpen },
  { label: 'Clase', to: '/clase', icon: School },
  { label: 'Teme', to: '/teme', icon: ClipboardList },
  { label: 'Anunțuri', to: '/anunturi', icon: Megaphone },
  { label: 'Scoruri', to: '/scoruri', icon: Trophy },
];

export default function MobileNavigation() {
  const { user } = useAuth();
  const accountItem = user
    ? { label: 'Profil', to: '/profil', icon: UserRound }
    : { label: 'Intră', to: '/login', icon: LogIn };

  return (
    <nav className="shrink-0 overflow-x-auto border-b border-border bg-sidebar lg:hidden" aria-label="Navigare principală">
      <div className="flex min-w-max items-stretch justify-center px-1.5 sm:px-2">
        {[...navigationItems, accountItem].map(({ label, to, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1.5 px-2.5 text-[10px] font-bold transition-colors sm:px-3 ${isActive ? 'text-accent' : 'text-muted hover:text-text-main'}`}>
            <Icon className="h-6 w-6 sm:h-5 sm:w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
