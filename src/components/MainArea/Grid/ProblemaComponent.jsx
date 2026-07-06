import { Code } from "lucide-react";
export default function ProblemaComponent(){
    return(
    <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-muted transition-all">
          <div>
            <div className="flex items-center gap-2 text-muted font-bold mb-2">
              <Code className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">Sugestie pentru tine</span>
            </div>
            <h3 className="text-xl font-bold text-text-main">Căutare Binară pe Șir Sortat</h3>
            <p className="text-muted text-sm mt-2">Bazează-te pe ce ai învățat ieri și încearcă să găsești elementul în timp O(log n).</p>
          </div>
          
          <div className="flex justify-between items-end mt-6">
            <div className="flex gap-3 items-center">
              <span className="text-xs text-medium font-bold px-2 py-1 bg-medium/10 rounded-md">Mediu</span>
              <span className="text-sm font-bold text-muted">25 pct</span>
            </div>
            <button className="bg-transparent border border-border text-text-main hover:bg-background-hover px-5 py-2 rounded-full text-sm font-bold transition-colors">
              Încearcă
            </button>
          </div>
        </div>);
}