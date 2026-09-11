import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ClassDeletionToast() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(location.state?.successMessage || '');
  useEffect(() => {
    if (!location.state?.successMessage) return;
    const { successMessage: _message, ...state } = location.state;
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state });
  }, [location, navigate]);

  if (!message) return null;
  return <div className="fixed bottom-4 left-4 right-4 z-40 flex items-start gap-3 rounded-xl border border-easy/30 bg-sidebar p-4 text-easy shadow-xl sm:left-auto sm:max-w-md">
    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
    <p role="status" className="min-w-0 flex-1 text-sm font-semibold">{message}</p>
    <button type="button" onClick={() => setMessage('')} aria-label="Închide notificarea" className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:outline-accent"><X aria-hidden="true" className="h-4 w-4" /></button>
  </div>;
}
