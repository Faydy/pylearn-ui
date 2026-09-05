import { AlertTriangle, CheckCircle2, Coins, ShoppingBag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TopHeader from '../components/MainArea/TopHeader';
import PageLoading from '../components/PageLoading';
import PurchaseAvatarDialog from '../components/shop/PurchaseAvatarDialog';
import ShopAvatarCard from '../components/shop/ShopAvatarCard';
import ShopProgressSummary from '../components/shop/ShopProgressSummary';
import { supabase } from '../supabaseClient';
import { getShopErrorMessage, getUserLevel } from '../utils/economy';

const FILTERS = [
  { id: 'all', label: 'Toate' },
  { id: 'available', label: 'Disponibile' },
  { id: 'locked', label: 'Blocate' },
  { id: 'owned', label: 'Deținute' },
];

export default function Shop() {
  const { user, profile, loading: authLoading, refreshAuth } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [ownedAvatarIds, setOwnedAvatarIds] = useState(new Set());
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('all');
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [buyingAvatarId, setBuyingAvatarId] = useState(null);
  const [equippingAvatarId, setEquippingAvatarId] = useState(null);

  const loadShop = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    const [{ data: catalogRows, error: catalogError }, { data: ownershipRows, error: ownershipError }] = await Promise.all([
      supabase.from('avatar_catalog').select('id, name, seed, gender_style, price_coins, required_level, rarity, is_onboarding_choice, sort_order').eq('is_active', true).order('sort_order').order('id'),
      supabase.from('user_avatars').select('avatar_id').eq('user_id', user.id),
    ]);

    if (catalogError || ownershipError) {
      setError('Shop-ul nu a putut fi încărcat. Încearcă din nou.');
      setLoading(false);
      return;
    }

    setCatalog(catalogRows || []);
    setOwnedAvatarIds(new Set((ownershipRows || []).map((row) => row.avatar_id)));
    setCoinBalance(Math.max(Number(profile?.coin_balance) || 0, 0));
    setLoading(false);
  }, [profile?.coin_balance, user]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const totalXp = Math.max(Number(profile?.total_xp) || 0, 0);
  const level = getUserLevel(totalXp);
  const avatarStates = useMemo(() => catalog.map((avatar) => {
    const owned = ownedAvatarIds.has(avatar.id);
    const equipped = profile?.avatar === avatar.seed;
    const locked = level < avatar.required_level;
    return { avatar, owned, equipped, locked };
  }), [catalog, level, ownedAvatarIds, profile?.avatar]);
  const stateCounts = useMemo(() => avatarStates.reduce((counts, item) => {
    if (item.owned) counts.owned += 1;
    else if (item.locked) counts.locked += 1;
    else counts.available += 1;
    return counts;
  }, { available: 0, locked: 0, owned: 0 }), [avatarStates]);
  const visibleAvatars = useMemo(() => avatarStates.filter((item) => {
    if (filter === 'owned') return item.owned;
    if (filter === 'locked') return !item.owned && item.locked;
    if (filter === 'available') return !item.owned && !item.locked;
    return true;
  }), [avatarStates, filter]);

  const handleBuy = async () => {
    if (!purchaseTarget) return;

    setBuyingAvatarId(purchaseTarget.id);
    setNotice({ text: '', type: '' });
    const { data, error: buyError } = await supabase.rpc('buy_avatar', { p_avatar_id: purchaseTarget.id });

    if (buyError) {
      console.error('Eroare la cumpărarea avatarului:', buyError);
      setNotice({ text: getShopErrorMessage(buyError), type: 'error' });
      setBuyingAvatarId(null);
      return;
    }

    const result = data?.[0];
    setOwnedAvatarIds((current) => new Set([...current, purchaseTarget.id]));
    setCoinBalance(Math.max(Number(result?.coin_balance) || 0, 0));
    setPurchaseTarget(null);
    setBuyingAvatarId(null);
    setNotice({ text: 'Avatar cumpărat! Îl poți echipa acum.', type: 'success' });
    await refreshAuth();
  };

  const handleEquip = async (avatar) => {
    setEquippingAvatarId(avatar.id);
    setNotice({ text: '', type: '' });
    const { error: equipError } = await supabase.rpc('set_my_avatar', { p_seed: avatar.seed });

    if (equipError) {
      setNotice({ text: getShopErrorMessage(equipError), type: 'error' });
      setEquippingAvatarId(null);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({ data: { avatar: avatar.seed } });
    await refreshAuth();
    setEquippingAvatarId(null);
    setNotice({
      text: metadataError ? 'Avatarul a fost echipat. Sincronizarea suplimentară a contului va fi reîncercată la următoarea autentificare.' : 'Avatar echipat cu succes!',
      type: 'success',
    });
  };

  if (authLoading || (user && loading)) return <PageLoading title="Shop" />;

  if (!user) {
    return <div className="flex h-full flex-col"><TopHeader title="Shop" /><div className="flex flex-1 items-center justify-center p-4 sm:p-6"><section className="max-w-md rounded-2xl border border-border bg-ink p-6 text-center sm:p-8"><ShoppingBag className="mx-auto h-9 w-9 text-accent" /><h1 className="mt-4 text-xl font-bold text-text-main">Intră în cont pentru Shop</h1><p className="mt-2 text-sm text-muted">Câștigă monede rezolvând probleme și deblochează avatare noi.</p><Link to="/login" className="mt-5 inline-flex rounded-xl bg-accent px-4 py-3 font-bold text-ink transition-colors hover:bg-accent/90">Intră în cont</Link></section></div></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <TopHeader title="Shop" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl pb-10">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Economia PyLearn</p><h1 className="mt-2 flex items-center gap-3 text-2xl font-bold text-text-main sm:text-3xl"><ShoppingBag className="h-7 w-7 text-accent" />Shop</h1><p className="mt-2 max-w-2xl text-muted">Folosește monedele câștigate rezolvând probleme pentru a debloca avatare noi.</p></div><Link to="/profil" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent"><Coins className="h-4 w-4 text-medium" />Profilul meu</Link></div>

          <ShopProgressSummary totalXp={totalXp} coinBalance={coinBalance} />

          {notice.text && <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${notice.type === 'success' ? 'border-easy/20 bg-easy/10 text-easy' : 'border-hard/20 bg-hard/10 text-hard'}`}>{notice.type === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}<p className="font-bold">{notice.text}</p></div>}

          <div className="mt-8 flex gap-2 overflow-x-auto pb-1" aria-label="Filtre avatare">{FILTERS.map((item) => { const count = item.id === 'all' ? avatarStates.length : stateCounts[item.id]; const active = filter === item.id; return <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={active} className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${active ? 'border-accent bg-accent text-ink' : 'border-border bg-ink text-muted hover:border-accent hover:text-text-main'}`}>{item.label} <span className="opacity-75">{count}</span></button>; })}</div>

          {error ? <section className="mt-6 rounded-2xl border border-hard/20 bg-hard/10 p-6 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-hard" /><h2 className="mt-4 text-xl font-bold text-text-main">Shop-ul nu este disponibil</h2><p className="mt-2 text-sm text-muted">{error}</p><button type="button" onClick={loadShop} className="mt-5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover">Încearcă din nou</button></section> : visibleAvatars.length === 0 ? <section className="mt-6 rounded-2xl border border-dashed border-border bg-ink p-8 text-center sm:p-12"><ShoppingBag className="mx-auto h-9 w-9 text-muted" /><h2 className="mt-4 text-xl font-bold text-text-main">Momentan nu există avatare disponibile în Shop.</h2><p className="mt-2 text-sm text-muted">Încearcă un alt filtru sau revino mai târziu.</p></section> : <section className="mt-6 grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleAvatars.map(({ avatar, owned, equipped }) => <ShopAvatarCard key={avatar.id} avatar={avatar} level={level} totalXp={totalXp} coinBalance={coinBalance} owned={owned} equipped={equipped} buying={buyingAvatarId === avatar.id} equipping={equippingAvatarId === avatar.id} onBuy={setPurchaseTarget} onEquip={handleEquip} />)}</section>}
        </div>
      </main>
      <PurchaseAvatarDialog avatar={purchaseTarget} coinBalance={coinBalance} saving={buyingAvatarId === purchaseTarget?.id} onClose={() => setPurchaseTarget(null)} onConfirm={handleBuy} />
    </div>
  );
}
