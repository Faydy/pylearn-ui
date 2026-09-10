import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Hash } from 'lucide-react';
import TopHeader from '../components/MainArea/TopHeader';
import ProblemFilters from '../components/problems/ProblemFilters';
import ProblemResults from '../components/problems/ProblemResults';
import ProblemCard from '../components/problems/ProblemCard';
import useProblemBrowser from '../hooks/useProblemBrowser';

export default function ToateProblemele() {
  const browser = useProblemBrowser();
  const category = browser.metadata?.categories.find((item) => item.slug === browser.filters.categorie);
  return (
    <div className="flex h-full min-w-0 flex-col">
      <TopHeader title={category ? 'Probleme filtrate' : 'Toate problemele'} />
      <div className="min-w-0 flex-1 overflow-y-auto p-4 pb-10 sm:p-6">
        <div className="mb-8">
          <Link to="/probleme" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la clase</Link>
          <h2 className="flex flex-wrap items-center gap-3 text-2xl font-bold capitalize text-text-main sm:text-3xl">{category ? <Hash className="h-8 w-8 text-accent" /> : <Code2 className="h-8 w-8 text-accent" />}{category?.name || 'Toate Problemele'}</h2>
          <p className="mt-2 text-muted">{category ? 'Aici găsești toate problemele asociate acestui concept.' : 'Caută, filtrează și rezolvă orice problemă de pe platformă.'}</p>
        </div>
        <ProblemFilters browser={browser} placeholder={category ? `Caută în ${category.name}...` : 'Caută o problemă după titlu...'} />
        <ProblemResults browser={browser}><div className="flex flex-col gap-4">{browser.problems.map((problem) => <ProblemCard key={problem.id} problem={problem} showCategory />)}</div></ProblemResults>
      </div>
    </div>
  );
}
