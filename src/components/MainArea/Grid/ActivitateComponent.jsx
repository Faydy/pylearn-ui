import { Flame } from "lucide-react";
export default function ActivitateComponent(){
    return(
    <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-muted transition-all">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-text-main mb-1">Activitate</h3>
              <p className="text-muted text-sm">Ține-o tot așa, ești pe drumul cel bun!</p>
            </div>
            <div className="bg-background p-3 rounded-full border border-border">
              <Flame className="w-6 h-6 text-[#ff8a00]" /> {/* Culoare foc */}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-background border border-border rounded-xl p-4 text-center">
              <span className="block text-3xl font-bold text-text-main">5</span>
              <span className="text-xs text-muted uppercase font-bold tracking-wider">Zile Streak</span>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 text-center">
              <span className="block text-3xl font-bold text-accent">1.2k</span>
              <span className="text-xs text-muted uppercase font-bold tracking-wider">Puncte Total</span>
            </div>
          </div>
        </div>
    );
}