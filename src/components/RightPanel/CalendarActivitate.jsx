import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarActivitate() {
  const weeks = 12;
  const daysInWeek = 7;
  const totalDays = weeks * daysInWeek;
  
  // 1. Aflăm ziua curentă a săptămânii
  // getDay() dă 0 (Duminică) -> 6 (Sâmbătă). Îl ajustăm ca 0 să fie Luni și 6 Duminică.
  const currentDayIndex = (new Date().getDay() + 6) % 7;
  const zileSaptamana = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

  // 2. Generăm datele
  const activityData = Array.from({ length: totalDays }, (_, index) => {
    const isActive = Math.random() > 0.5; 
    // Ultima zi din array (când indexul ajunge la capăt) este "Azi"
    const isToday = index === totalDays - 1; 
    
    // Calculăm data reală pentru tooltip
    const dateObj = new Date(Date.now() - (totalDays - 1 - index) * 24 * 60 * 60 * 1000);
    
    return {
      date: dateObj.toLocaleDateString('ro-RO'),
      isActive: isActive,
      isToday: isToday
    };
  });

  return (
    <div className="bg-ink mt-6 border border-border p-6 rounded-2xl">
      
      {/* Header-ul Componentei */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-bold text-text-main">Istoric Activitate</h3>
          </div>
          <p className="text-sm text-muted">Zile în care ai rezolvat cel puțin o problemă.</p>
        </div>
      </div>

      {/* Grila Calendarului */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-fit flex gap-4">
          
          {/* Etichetele cu TOATE zilele săptămânii */}
          <div className="flex flex-col gap-1.5 pr-2">
            {zileSaptamana.map((zi, index) => (
              <span 
                key={zi} 
                // Aliniem textul exact la fel cu pătrățelele (h-3.5)
                // Dacă indexul zilei se potrivește cu ziua de azi, o facem auriu și bold
                className={`text-[10px] h-3.5 flex items-center uppercase tracking-wider ${
                  index === currentDayIndex ? 'text-accent font-bold' : 'text-muted font-medium'
                }`}
              >
                {zi}
              </span>
            ))}
          </div>

          {/* Containerul cu pătrățele */}
          <div className="grid grid-rows-7 grid-flow-col gap-1.5">
            {activityData.map((day, index) => (
              <div 
                key={index}
                title={day.isToday ? 'Azi' : (day.isActive ? `Ai lucrat pe ${day.date}` : `Nicio activitate pe ${day.date}`)}
                className={`w-3.5 h-3.5 rounded-sm border transition-all cursor-pointer hover:scale-110
                  ${day.isActive ? 'bg-accent border-accent' : 'bg-transparent border-border hover:border-muted'}
                  ${day.isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-ink' : ''} 
                `}
                // Explicație "isToday": Am adăugat un `ring` exterior pentru a scoate clar în evidență ziua curentă
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-end gap-4 mt-2 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-transparent border border-border"></div>
          <span className="text-muted">Inactiv</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-accent border border-accent"></div>
          <span className="text-text-main">Activ</span>
        </div>
      </div>

    </div>
  );
}