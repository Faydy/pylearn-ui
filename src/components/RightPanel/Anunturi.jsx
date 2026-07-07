import { Megaphone, Calendar, ChevronRight } from 'lucide-react';

export default function Anunturi() {
  // Date simulate pentru anunțuri. În viitor, acestea vor veni din baza de date.
  const announcements = [
    {
      id: 1,
      title: "Concurs de Algoritmică",
      date: "Azi, 18:00",
      description: "Participă la provocarea săptămânii! XP dublu pentru primele 10 rezolvări perfecte.",
      type: "important", // Va folosi culoarea accent (auriu)
    },
    {
      id: 2,
      title: "Modul Nou: Dicționare",
      date: "Ieri",
      description: "Am adăugat 15 probleme noi la capitolul Dicționare în Python.",
      type: "update", // Va folosi culoarea easy (verde)
    },
    {
      id: 3,
      title: "Mentenanță programată",
      date: "3 iul.",
      description: "Platforma va fi indisponibilă vineri noapte între 02:00 și 04:00.",
      type: "info", // Va folosi culoarea muted (gri)
    }
  ];

  // O funcție care returnează culoarea potrivită în funcție de tipul anunțului
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'important': return 'bg-accent text-ink';
      case 'update': return 'bg-easy text-ink';
      default: return 'bg-border text-text-main';
    }
  };

  const getBorderStyle = (type) => {
    switch (type) {
      case 'important': return 'border-accent';
      case 'update': return 'border-easy';
      default: return 'border-border';
    }
  };

  return (
    <div className="bg-ink rounded-2xl border border-border p-5">
      
      {/* Header-ul Componentei */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent" />
          <h3 className="text-text-main font-bold text-lg">Anunțuri</h3>
        </div>
        <button className="text-xs text-muted hover:text-text-main transition-colors font-bold">
          Vezi toate
        </button>
      </div>

      {/* Lista de anunțuri */}
      <div className="flex flex-col gap-4">
        {announcements.map((item) => (
          <div 
            key={item.id} 
            // Bara colorată din stânga este creată folosind border-l-4
            className={`pl-4 border-l-4 ${getBorderStyle(item.type)} hover:bg-background/50 p-2 -ml-2 rounded-r-lg cursor-pointer transition-colors group`}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-text-main font-bold text-sm group-hover:text-accent transition-colors">
                {item.title}
              </h4>
              <span className="text-[10px] text-muted flex items-center gap-1 font-bold">
                <Calendar className="w-3 h-3" />
                {item.date}
              </span>
            </div>
            
            <p className="text-muted text-xs leading-relaxed line-clamp-2 mt-1">
              {item.description}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${getBadgeStyle(item.type)}`}>
                {item.type === 'important' ? 'Important' : item.type === 'update' ? 'Nou' : 'Info'}
              </span>
              <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}