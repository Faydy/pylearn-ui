import { AlertTriangle, Award, LogIn, RefreshCw, Search, Trophy, UserRound, Users } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TopHeader from '../components/MainArea/TopHeader';
import ScoreLeaderboard from '../components/scores/ScoreLeaderboard';
import ScorePodium from '../components/scores/ScorePodium';
import { supabase } from '../supabaseClient';
import { formatXp } from '../utils/leaderboard';

const PAGE_SIZE = 20;

export default function Scoruri() {
  const { user } = useAuth();
  const [topEntries, setTopEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [myStanding, setMyStanding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [podiumLoading, setPodiumLoading] = useState(true);
  const [standingLoading, setStandingLoading] = useState(Boolean(user));
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    let cancelled = false;

    async function fetchPodium() {
      setPodiumLoading(true);
      const { data, count, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, total_xp', { count: 'exact' })
        .not('username', 'is', null)
        .order('total_xp', { ascending: false })
        .order('username', { ascending: true })
        .limit(3);

      if (cancelled) return;
      if (fetchError) {
        console.error('Eroare la încărcarea podiumului:', fetchError.message);
        setTopEntries([]);
        setGlobalTotal(0);
      } else {
        setTopEntries(data || []);
        setGlobalTotal(count || 0);
      }
      setPodiumLoading(false);
    }

    fetchPodium();
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      setLoading(true);
      setError('');

      let query = supabase
        .from('profiles')
        .select('id, username, total_xp', { count: 'exact' })
        .not('username', 'is', null)
        .order('total_xp', { ascending: false })
        .order('username', { ascending: true });

      if (deferredSearch) {
        query = query.ilike('username', `%${deferredSearch}%`);
      }

      const start = (page - 1) * PAGE_SIZE;
      const { data, count, error: fetchError } = await query.range(start, start + PAGE_SIZE - 1);
      if (cancelled) return;

      if (fetchError) {
        setError('Clasamentul nu a putut fi încărcat. Încearcă din nou.');
        setEntries([]);
        setTotal(0);
      } else {
        setEntries(data || []);
        setTotal(count || 0);
      }
      setLoading(false);
    }

    fetchLeaderboard();
    return () => { cancelled = true; };
  }, [deferredSearch, page, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    async function fetchMyStanding() {
      if (!user) {
        setMyStanding(null);
        setStandingLoading(false);
        return;
      }

      setStandingLoading(true);
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, total_xp')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !currentProfile) {
        if (!cancelled) {
          setMyStanding(null);
          setStandingLoading(false);
        }
        return;
      }

      const { count, error: rankError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('total_xp', currentProfile.total_xp || 0);

      if (!cancelled) {
        setMyStanding(rankError ? null : { ...currentProfile, rank: (count || 0) + 1 });
        setStandingLoading(false);
      }
    }

    fetchMyStanding();
    return () => { cancelled = true; };
  }, [reloadKey, user]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleRetry = () => setReloadKey((currentKey) => currentKey + 1);
  const highestScore = topEntries[0]?.total_xp || 0;

  return (
    <div className="flex h-full flex-col"><TopHeader title="Scoruri" /><main className="flex-1 overflow-y-auto p-5 sm:p-6"><div className="mx-auto w-full max-w-6xl pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/15 via-ink to-ink px-6 py-8 sm:px-8 sm:py-10"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/15 blur-3xl" /><div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent"><Trophy className="h-4 w-4" />Clasament global</div><h1 className="mt-5 text-3xl font-black tracking-tight text-text-main sm:text-4xl">Fiecare problemă rezolvată te urcă în clasament.</h1><p className="mt-3 text-base text-muted">Compară progresul tuturor exploratorilor PyLearn după experiența acumulată.</p></div>{user ? <Link to="/profil" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-ink transition-colors hover:bg-accent/90"><UserRound className="h-5 w-5" />Vezi profilul meu</Link> : <Link to="/login" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-ink transition-colors hover:bg-accent/90"><LogIn className="h-5 w-5" />Intră în cont</Link>}</div></section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-border bg-ink p-5"><Users className="h-5 w-5 text-accent" /><p className="mt-4 text-2xl font-black text-text-main">{podiumLoading ? '...' : globalTotal}</p><p className="mt-1 text-sm text-muted">utilizatori în clasament</p></article><article className="rounded-2xl border border-border bg-ink p-5"><Award className="h-5 w-5 text-accent" /><p className="mt-4 text-2xl font-black text-text-main">{podiumLoading ? '...' : formatXp(highestScore)}</p><p className="mt-1 text-sm text-muted">cel mai mare scor</p></article><article className="rounded-2xl border border-border bg-ink p-5">{user ? <><Trophy className="h-5 w-5 text-accent" /><p className="mt-4 text-2xl font-black text-text-main">{standingLoading ? '...' : myStanding ? `#${myStanding.rank}` : '—'}</p><p className="mt-1 text-sm text-muted">{myStanding ? `${formatXp(myStanding.total_xp)} acumulați` : 'Poziția ta în clasament'}</p></> : <><UserRound className="h-5 w-5 text-accent" /><p className="mt-4 text-lg font-black text-text-main">Ai un cont?</p><p className="mt-1 text-sm text-muted">Intră pentru a-ți urmări poziția.</p></>}</article></section>

      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-black text-text-main">Podiumul PyLearn</h2><p className="mt-1 text-sm text-muted">Cei trei utilizatori cu cele mai multe XP.</p></div><button type="button" onClick={handleRetry} disabled={loading || podiumLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-ink px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:border-muted hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading || podiumLoading ? 'animate-spin' : ''}`} />Actualizează</button></div>
      <div className="mt-4"><ScorePodium entries={topEntries} loading={podiumLoading} /></div>

      <section className="mt-8"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-black text-text-main">Toți participanții</h2><p className="mt-1 text-sm text-muted">Caută un utilizator sau răsfoiește clasamentul.</p></div><label className="relative block w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input type="search" value={search} onChange={handleSearchChange} placeholder="Caută după username..." className="w-full rounded-xl border border-border bg-ink py-3 pl-10 pr-4 text-sm text-text-main outline-none transition-colors placeholder:text-muted focus:border-accent" /></label></div>{error ? <div className="rounded-2xl border border-hard/25 bg-hard/10 p-5 text-hard"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Nu am putut încărca scorurile.</p><p className="mt-1 text-sm">{error}</p><button type="button" onClick={handleRetry} className="mt-4 rounded-lg border border-hard/30 px-3 py-2 text-sm font-bold transition-colors hover:bg-hard/10">Încearcă din nou</button></div></div></div> : <ScoreLeaderboard entries={entries} loading={loading} currentUserId={user?.id} currentPage={page} total={total} pageSize={PAGE_SIZE} searchActive={Boolean(deferredSearch)} onPageChange={setPage} />}</section>
    </div></main></div>
  );
}
