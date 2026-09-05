import { Check, Coins, LockKeyhole, ShoppingBag } from 'lucide-react';
import { getAvatarUrl } from '../../utils/profile';
import { formatCoins, getRarityClasses } from '../../utils/economy';

const RARITY_LABELS = {
  common: 'Comun',
  rare: 'Rar',
  epic: 'Epic',
  legendary: 'Legendar',
};

export default function ShopAvatarCard({ avatar, level, totalXp, coinBalance, owned, equipped, buying, equipping, onBuy, onEquip }) {
  const locked = level < avatar.required_level;
  const canAfford = coinBalance >= avatar.price_coins;
  const actionPending = buying || equipping;

  return (
    <article className={`relative flex min-h-[330px] flex-col overflow-hidden rounded-2xl border bg-ink p-4 transition-colors sm:p-5 ${equipped ? 'border-accent ring-1 ring-accent/40' : 'border-border hover:border-muted'}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getRarityClasses(avatar.rarity)}`}>{RARITY_LABELS[avatar.rarity] || 'Comun'}</span>
        {equipped && <span className="inline-flex items-center gap-1 rounded-md border border-easy/20 bg-easy/10 px-2 py-1 text-xs font-bold text-easy"><Check className="h-3.5 w-3.5" />Echipat</span>}
      </div>

      <div className={`mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-2xl border border-border bg-background p-2 ${locked ? 'opacity-50 grayscale' : ''}`}><img src={getAvatarUrl(avatar.seed)} alt={`Avatar ${avatar.name}`} className="h-full w-full rounded-xl" /></div>

      <div className="mt-5"><h2 className="text-xl font-bold text-text-main">{avatar.name}</h2><p className="mt-1 text-sm text-muted">Nivel {avatar.required_level}</p></div>

      <div className="mt-4 min-h-10">
        {locked ? <p className="flex items-center gap-2 text-sm font-bold text-muted"><LockKeyhole className="h-4 w-4" />Se deblochează la nivelul {avatar.required_level}</p> : <p className="flex items-center gap-1.5 text-sm font-bold text-medium"><Coins className="h-4 w-4" />{avatar.price_coins === 0 ? 'Gratuit' : `${formatCoins(avatar.price_coins)} monede`}</p>}
      </div>

      <div className="mt-auto pt-5">
        {equipped ? <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-easy/20 bg-easy/10 px-4 py-3 text-sm font-bold text-easy"><Check className="h-4 w-4" />Echipat</div> : locked ? <div className="rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-bold text-muted">Mai ai {Math.max((avatar.required_level * 100) - totalXp, 0)} XP până la deblocare</div> : owned ? <button type="button" onClick={() => onEquip(avatar)} disabled={actionPending} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-main transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4" />{equipping ? 'Se echipează...' : 'Echipează'}</button> : <><button type="button" onClick={() => onBuy(avatar)} disabled={!canAfford || actionPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBag className="h-4 w-4" />{buying ? 'Se cumpără...' : (avatar.price_coins === 0 ? 'Revendică' : 'Cumpără')}</button>{!canAfford && <p className="mt-2 text-center text-xs font-medium text-hard">Nu ai suficiente monede.</p>}</>}
      </div>
    </article>
  );
}
