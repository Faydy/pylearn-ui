import Anunturi from "./Anunturi"
import Clasament from "./Clasament";
import CalendarActivitate from "./CalendarActivitate";
export default function RightSidebar() {
  return (
    <div className="grid content-start gap-6 border-t border-border p-4 md:grid-cols-2 xl:grid-cols-1 xl:border-l xl:border-t-0">
    <Anunturi/>
    <Clasament/>
    <CalendarActivitate/>
    </div>
  );
}
