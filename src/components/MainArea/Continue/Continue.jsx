import ContinueComponent from "./ContinueComponent";
export default function Continue(){
    return(
        <div className="mt-4">
            <h2 className="font-semi font-mono">Continuă de unde ai rămas</h2>
            <div className="grid grid-cols-3 gap-3 mt-4">
                <ContinueComponent categorie="Categorie" titlu="Titlu" procentaj={20}/>
                <ContinueComponent categorie="Categorie" titlu="Titlu" procentaj={20}/>
                <ContinueComponent categorie="Categorie" titlu="Titlu" procentaj={20}/>
            </div>
        </div>
    );
}