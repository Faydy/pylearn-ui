import ActivitateComponent from "./ActivitateComponent";
import TemaComponent from "./TemaComponent"
import ProblemaComponent from "./ProblemaComponent";
import TeorieComponent from "./TeorieComponent";

export default function TaskGrid(){
    return (
        <div className="grid w-full grid-cols-2 overflow-y-auto p-4 gap-4 ">
            <TemaComponent />
            <ProblemaComponent />
            <ActivitateComponent />
            <TeorieComponent />
        </div>
    );
}
