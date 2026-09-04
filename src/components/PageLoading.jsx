import { Loader2 } from 'lucide-react';
import TopHeader from './MainArea/TopHeader';

export default function PageLoading({ title = 'Se încarcă...' }) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col lg:min-h-[calc(100dvh-4rem)]">
      <TopHeader title={title} />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    </div>
  );
}
