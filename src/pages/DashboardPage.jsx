import TopHeader from '../components/MainArea/TopHeader';
import TaskGrid from '../components/MainArea/TaskGrid';
import RightSidebar from '../components/RightPanel/RightSidebar';

export default function DashboardPage() {
  return (
    <div className="flex h-full p-6 gap-6">
      
      {/* Coloana Centrală */}
      <div className="flex-1 flex flex-col">
        <TopHeader />
        <TaskGrid />
      </div>
      
      {/* Coloana din Dreapta */}
      <div className="w-80 flex-shrink-0">
        <RightSidebar />
      </div>
      
    </div>
  );
}