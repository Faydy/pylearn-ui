export default function CurriculumProgress({ total, solved, personal, label = 'Progres' }) {
  const percent = total > 0 ? Math.round(solved / total * 100) : 0;
  return <div className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-muted">{personal ? `${solved} / ${total} ${total === 1 ? 'problemă rezolvată' : 'probleme rezolvate'}` : `${total} ${total === 1 ? 'problemă' : 'probleme'}`}</span>
      {personal && <span className="font-bold text-accent">{percent}%</span>}
    </div>
    {personal && <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-3 h-2 overflow-hidden rounded-full bg-sidebar-hover"><div className={`h-full rounded-full ${total > 0 && solved === total ? 'bg-easy' : 'bg-accent'}`} style={{ width: `${percent}%` }} /></div>}
  </div>;
}
