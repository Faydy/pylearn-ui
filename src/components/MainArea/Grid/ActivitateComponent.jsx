import { Flame, Loader2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";
import { useEffect, useState } from "react";
export default function ActivitateComponent(){
    const [activitateData, setActivitateData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchActiviate = async () => {
        try{
          const {data : {session}, error: sessionError} = await supabase.auth.getSession();
          if(sessionError)
            throw sessionError;

          const currentUserId = session?.user?.id;
          if(!currentUserId) return;

          const {data, error} = await supabase.from('profiles').select('total_xp, current_streak').eq('id', currentUserId).single();

          if(error) throw error;
          setActivitateData(data);
        } catch (error){
          console.log("Eroare la incarcarea activitatii:", error);
        } finally{
          setIsLoading(false);
        }
      };
      fetchActiviate();
    } , []);

    if (isLoading) {
        return (
            <div className="bg-ink border border-border p-6 rounded-2xl h-full flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted" />
            </div>
        );
    }

    return(
    <div className="bg-ink border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-muted transition-all">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-text-main mb-1">Activitate</h3>
              <p className="text-muted text-sm">Ține-o tot așa, ești pe drumul cel bun!</p>
            </div>
            <div className="bg-background p-3 rounded-full border border-border">
              <Flame className="w-6 h-6 text-[#ff8a00]" /> {/* Culoare foc */}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-background border border-border rounded-xl p-4 text-center">
              <span className="block text-3xl font-bold text-text-main">{activitateData?.current_streak || 0}</span>
              <span className="text-xs text-muted uppercase font-bold tracking-wider">Zile Streak</span>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 text-center">
              <span className="block text-3xl font-bold text-accent">{activitateData?.total_xp || 0}</span>
              <span className="text-xs text-muted uppercase font-bold tracking-wider">Puncte Total</span>
            </div>
          </div>
        </div>
    );
}