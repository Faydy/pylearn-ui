import { Search, Bell, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
export default function TopHeader({title = "Dashboard"}) {
    const [isDark, setIsDark] = useState(true);
    useEffect(() => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [isDark]);
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      
      <div>
        <h2 className="text-text-main font-bold text-lg">{title}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Caută probleme..." 
            className="bg-background border border-border text-text-main text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-accent transition-colors w-64 placeholder:text-muted"
          />
        </div>

        <button className="text-muted hover:text-text-main transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-hard rounded-full border border-sidebar"></span>
        </button>

        {/* 3. Linia despărțitoare verticală */}
        <div className="hidden h-6 w-px bg-border sm:block"></div>

        {/* 4. Butonul pentru Trecere pe Light Mode */}
        <button aria-label={isDark ? 'Activează tema luminoasă' : 'Activează tema întunecată'} className="flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1.5 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover sm:px-3" onClick={() => setIsDark(!isDark)}>
          <Sun className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">{isDark ? 'Dark mode' : 'Light mode'}</span>
        </button>
        
      </div>
    </header>
  );
}
