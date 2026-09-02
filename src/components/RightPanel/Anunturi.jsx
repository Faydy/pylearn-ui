import { Megaphone, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Anunturi() {
  const [anunturiData, setAnunturiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchAnunturi = async() => {
    try{
        const {data, error: anunturiError} = await supabase
          .from('announcements')
          .select('id, title, body, tag, published_at')
          .order('published_at', {ascending: false})
          .limit(3);

          if(anunturiError) throw anunturiError;
          if (!cancelled) setAnunturiData(data || []);
      } catch(anunturiError) {
        console.log("Eroare la incarcarea anunturilor globale:", anunturiError); 
        if (!cancelled) setError('Anunțurile nu au putut fi încărcate.');
      } finally{
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchAnunturi();
    return () => { cancelled = true; };
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return `Azi, ${date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri';
    }
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  const getBadgeStyle = (tag) => {
    switch (tag) {
      case 'important': return 'bg-accent text-ink';
      case 'nou':       return 'bg-easy text-ink';
      default:          return 'bg-border text-text-main';
    }
  };

  const getBorderStyle = (tag) => {
    switch (tag) {
      case 'important': return 'border-accent';
      case 'nou':       return 'border-easy';
      default:          return 'border-border';
    }
  };

  const getTagLabel = (tag) => {
    switch (tag) {
      case 'important': return 'IMPORTANT';
      case 'nou':       return 'NOU';
      default:          return 'INFO';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-ink rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-6 bg-border rounded w-32 mb-6" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-border/50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink rounded-2xl border border-border p-5">
      
      {/* Header-ul Componentei */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent" />
          <h3 className="text-text-main font-bold text-lg">Anunțuri</h3>
        </div>
        <Link to="/anunturi" className="text-xs text-muted hover:text-text-main transition-colors font-bold">
          Vezi toate
        </Link>
      </div>
      {/* Lista de anunțuri */}
      {error ? <p className="text-sm text-hard">{error}</p> : anunturiData.length === 0 ? <p className="text-sm text-muted">Nu există anunțuri momentan.</p> : <div className="flex flex-col gap-4">
        {anunturiData.map((item) => (
          <Link
            key={item.id} 
            to={`/anunturi#announcement-${item.id}`}
            // Bara colorată din stânga este creată folosind border-l-4
            className={`block pl-4 border-l-4 ${getBorderStyle(item.tag)} hover:bg-background/50 p-2 -ml-2 rounded-r-lg cursor-pointer transition-colors group`}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-text-main font-bold text-sm group-hover:text-accent transition-colors">
                {item.title}
              </h4>
              <span className="text-[10px] text-muted flex items-center gap-1 font-bold">
                <Calendar className="w-3 h-3" />
                {formatDate(item.published_at)}
              </span>
            </div>
            
            <p className="text-muted text-xs leading-relaxed line-clamp-2 mt-1">
              {item.body}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${getBadgeStyle(item.tag)}`}>
                {getTagLabel(item.tag)}
              </span>
              <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
            </div>
          </Link>
        ))}
      </div>}

    </div>
  );
}
