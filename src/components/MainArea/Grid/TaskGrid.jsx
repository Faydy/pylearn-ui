import ActivitateComponent from "./ActivitateComponent";
import TemaComponent from "./TemaComponent"
import ProblemaComponent from "./ProblemaComponent";
import TeorieComponent from "./TeorieComponent";
import { Flame, BookOpen, Target } from 'lucide-react';

export default function TaskGrid({numeTema = "false", nrProblemeTema = 4, dificultateTema = "Mediu", dificultateProblema = "Mediu"}){
    function hasTema(){
        if(numeTema != "false")
            return (<TemaComponent 
                eticheta="Tema Curentă"
                titlu={numeTema}
                descriere={`Rezolvă cele ${nrProblemeTema} probleme asignate de profesorul tău pentru a finaliza tema.`}
                dificultate={dificultateTema}
                Icon = {Target}
                />);
    }
    return (
        <div className="grid w-full grid-cols-2 overflow-y-auto p-4 gap-4 ">
            {hasTema()}
            <ProblemaComponent
                eticheta="Sugestie pentru tine"
                titlu="Căutare Binară pe Șir Sortat"
                descriere="Bazează-te pe ce ai învățat ieri și încearcă să găsești elementul în timp O(log n)."
                dificultateProblema={dificultateProblema}
                />
            <ActivitateComponent />
            <TeorieComponent />
        </div>
    );
}