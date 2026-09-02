import TopHeader from '../components/MainArea/TopHeader';
import TaskGrid from '../components/MainArea/Grid/TaskGrid';
import RightSidebar from '../components/RightPanel/RightSidebar';
import Continue from "../components/MainArea/Continue/Continue"
import ListaProbleme from '../components/MainArea/ListaProbleme';

export default function Dashboard() {

  return (
    // 1. Am adăugat 'w-full' aici
    <div className="flex min-h-full w-full flex-col xl:flex-row">
      
      {/* 2. Coloana Centrală primește 'flex-1' pentru a se extinde pe rezoluții mari */}
      {/*    Am adăugat și 'min-w-0' ca să fim siguri că nu va depăși lățimea ecranului */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <div className="flex flex-1 flex-col p-4 sm:p-6">
          <TaskGrid />
          <Continue />
          <ListaProbleme/>
        </div>
      </div>
        
      {/* Coloana din Dreapta rămâne la fel */}
      <div className="w-full shrink-0 xl:w-80">
        <RightSidebar />
      </div>
      
    </div>
  );
}
