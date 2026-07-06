import TopHeader from '../components/MainArea/TopHeader';
import TaskGrid from '../components/MainArea/Grid/TaskGrid';
import RightSidebar from '../components/RightPanel/RightSidebar';

export default function Dashboard() {
  return (
    
    <div className="flex h-full gap-6">
      
      {/* Coloana Centrală */}
      <div className="flex-1 p-6 flex flex-col">
        <TopHeader />
        <TaskGrid numeTema='tema 1'/>
      </div>
      
      {/* Coloana din Dreapta */}
      <div className="w-80 flex-shrink-0">
        <RightSidebar />
      </div>
      
    </div>
  );
}