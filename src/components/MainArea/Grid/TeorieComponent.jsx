import { BookOpen, ArrowRight, Clock } from "lucide-react";
export default function TeorieComponent(){
    return(
        <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-muted transition-all">
          <div>
            <div className="flex items-center gap-2 text-muted font-bold mb-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">Lecția Următoare</span>
            </div>
            <h3 className="text-xl font-bold text-text-main">Introducere în Liste (Arrays)</h3>
            <p className="text-muted text-sm mt-2">Află cum să stochezi mai multe valori într-o singură variabilă folosind listele din Python.</p>
          </div>
          
          <div className="flex justify-between items-end mt-6">
             <span className="text-xs text-muted flex items-center gap-1"><Clock className="w-3 h-3"/> ~ 10 min de citit</span>
            <button className="flex items-center gap-2 text-accent hover:text-white transition-colors text-sm font-bold">
              Deschide Lecția <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
    );
}