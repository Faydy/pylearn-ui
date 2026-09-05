import { Coins, ShoppingBag, X } from 'lucide-react';
import { getAvatarUrl } from '../../utils/profile';
import { formatCoins } from '../../utils/economy';

export default function PurchaseAvatarDialog({ avatar, coinBalance, saving, onClose, onConfirm }) {
  if (!avatar) return null;

  const remainingCoins = Math.max(coinBalance - avatar.price_coins, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="purchase-avatar-title">
      <div className="my-auto w-full max-w-md rounded-2xl border border-border bg-ink p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><ShoppingBag className="h-6 w-6" /></div><h2 id="purchase-avatar-title" className="mt-4 text-2xl font-bold text-text-main">Cumpără avatarul {avatar.name}?</h2><p className="mt-2 text-sm text-muted">Prețul și soldul sunt validate din nou în siguranță înainte de cumpărare.</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Închide" className="rounded-lg p-2 text-muted transition-colors hover:bg-sidebar-hover hover:text-text-main"><X className="h-5 w-5" /></button></div>
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-background p-4"><img src={getAvatarUrl(avatar.seed)} alt="" className="h-16 w-16 rounded-xl" /><div><p className="font-bold text-text-main">{avatar.name}</p><p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-medium"><Coins className="h-4 w-4" />{avatar.price_coins === 0 ? 'Gratuit' : `${formatCoins(avatar.price_coins)} monede`}</p></div></div>
        <p className="mt-4 text-sm text-muted">Vei rămâne cu aproximativ <strong className="text-text-main">{formatCoins(remainingCoins)} monede</strong>.</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:opacity-50">Anulează</button><button type="button" onClick={onConfirm} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-accent/90 disabled:opacity-50"><ShoppingBag className="h-4 w-4" />{saving ? 'Se cumpără...' : 'Cumpără'}</button></div>
      </div>
    </div>
  );
}
