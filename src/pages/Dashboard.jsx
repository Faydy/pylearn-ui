import TopHeader from '../components/MainArea/TopHeader';
import TaskGrid from '../components/MainArea/Grid/TaskGrid';
import RightSidebar from '../components/RightPanel/RightSidebar';
import Continue from "../components/MainArea/Continue/Continue"
import ListaProbleme from '../components/MainArea/ListaProbleme';

export default function Dashboard() {

  return (
    // 1. Am adăugat 'w-full' aici
    <div className="flex w-full min-h-full">
      
      {/* 2. Coloana Centrală primește 'flex-1' pentru a se extinde pe rezoluții mari */}
      {/*    Am adăugat și 'min-w-0' ca să fim siguri că nu va depăși lățimea ecranului */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <div className="p-6 flex flex-col flex-1">
          <TaskGrid numeTema='tema 1'/>
          <Continue />
          <ListaProbleme/>
        </div>
      </div>
        
      {/* Coloana din Dreapta rămâne la fel */}
      <div className="w-80 flex-shrink-0">
        <RightSidebar />
      </div>
      
    </div>
  );
}