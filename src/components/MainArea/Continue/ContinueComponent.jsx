import ProgressBar from "./ProgressBar";
import { Play } from "lucide-react";
export default function ContinueComponent({categorie = "TEORIE", titlu = "Bucle for si while", procentaj = 10}){
    return(
        <div className="flex flex-col rounded-xl border border-border hover:border-muted p-3">
            <div className="p-2 font-mono">
                <p className="text-xs text-muted pt-2 pb-2">{categorie}</p>
                <h1 className="text-main font-semibold text-s">{titlu}</h1>
                <ProgressBar procentaj={procentaj}/>
                <button className="flex mt-4 p-1 pt-2 cursor-pointer pb-2 w-full gap-2 font-[650] font-mono text-sm border bg-accent text-background rounded-lg items-center justify-center">
                    <Play className="w-4"/>
                    Continua
                </button>
            </div>
        </div>
    );
}