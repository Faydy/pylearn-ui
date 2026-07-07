import TopHeader from '../components/MainArea/TopHeader';
import TaskGrid from '../components/MainArea/Grid/TaskGrid';
import RightSidebar from '../components/RightPanel/RightSidebar';
import Continue from "../components/MainArea/Continue/Continue"
import ListaProbleme from '../components/MainArea/ListaProbleme';

export default function Dashboard() {
  return (
    
    <div className="flex min-h-full">
      
      {/* Coloana Centrală */}
      <div>
        <TopHeader />
        <div className="flex-1 p-6 flex flex-col">
          <TaskGrid numeTema='tema 1'/>
          <Continue />
          <ListaProbleme/>
        </div>
      </div>
        
      
      {/* Coloana din Dreapta */}
      <div className="w-80 flex-shrink-0">
        <RightSidebar />
      </div>
      
    </div>
  );
}