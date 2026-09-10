import { useEffect, useState } from 'react';
import { getBucharestToday } from '../utils/activity';

// Refresh date-dependent reads when an open tab crosses Romanian midnight,
// including when a suspended/background tab is resumed.
export function useBucharestToday() {
  const [today, setToday] = useState(getBucharestToday);

  useEffect(() => {
    const refresh = () => setToday(getBucharestToday());
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return today;
}
