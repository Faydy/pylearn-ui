import Anunturi from "./Anunturi"
import Clasament from "./Clasament";
import CalendarActivitate from "./CalendarActivitate";
export default function RightSidebar() {
  return (
    <div className="p-4 border-l min-h-full border-border">
    <Anunturi/>
    <Clasament/>
    <CalendarActivitate/>
    </div>
  );
}