import {Code} from 'lucide-react'
export default function TemaComponent({
    titlu = "Titlu", 
    descriere = "Descriere",
    eticheta = "Eticheta",
    Icon = Code,
    dificultateTema = "Mediu"
}){
    function dif(){
        return(
            <span className={`text-xs font-bold px-2 py-1 bg-medium/10 rounded-md
                ${(dificultateTema === "Usor")? "text-easy": ""}
                ${(dificultateTema === "Mediu")? "text-medium": ""}
                ${(dificultateTema === "Greu")? "text-hard": ""}`}
            >{dificultateTema}</span>
        );
    }

    return(
        <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-muted transition-all">
          <div>
            <div className="flex items-center gap-2 text-muted font-bold mb-2">
              <Icon className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">{eticheta}</span>
            </div>
            <h3 className="text-xl font-bold text-text-main">{titlu}</h3>
            <p className="text-muted text-sm mt-2">{descriere}</p>
          </div>
          
          <div className="flex justify-between items-end mt-6">
            <div className="flex gap-3 items-center">
              {dif()}
              <span className="text-sm font-bold text-muted">25 pct</span>
            </div>
            <button className="bg-transparent border border-border text-text-main hover:bg-background-hover px-5 py-2 rounded-full text-sm font-bold transition-colors">
              Încearcă
            </button>
          </div>
        </div>
    );
}