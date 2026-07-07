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
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
      
      <div>
        <h2 className="text-text-main font-bold text-lg">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        
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
        <div className="h-6 w-px bg-border"></div>

        {/* 4. Butonul pentru Trecere pe Light Mode */}
        <button className="flex items-center gap-2 bg-background hover:bg-sidebar-hover border border-border text-text-main text-sm font-bold py-1.5 px-3 rounded-full transition-colors" onClick={() => setIsDark(!isDark)}>
          <Sun className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">{isDark ? 'Dark mode' : 'Light mode'}</span>
        </button>
        
      </div>
    </header>
  );
}