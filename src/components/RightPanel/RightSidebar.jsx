import Anunturi from "./Anunturi"
import Clasament from "./Clasament";
import CalendarActivitate from "./CalendarActivitate";
export default function RightSidebar() {
  return (
    <div className="grid min-h-full gap-6 border-t border-border p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-1 2xl:border-l 2xl:border-t-0">
    <Anunturi/>
    <Clasament/>
    <CalendarActivitate/>
    </div>
  );
}
