import ActivitateComponent from "./ActivitateComponent";
import TemaComponent from "./TemaComponent"
import ProblemaComponent from "./ProblemaComponent";
import TeorieComponent from "./TeorieComponent";

export default function TaskGrid(){
    return (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <TemaComponent />
            <ProblemaComponent />
            <ActivitateComponent />
            <TeorieComponent />
        </div>
    );
}
