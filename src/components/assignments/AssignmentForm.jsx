import { Check, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AssignmentProblemList from './AssignmentProblemList';
import { getDifficultyClasses, toDateTimeLocalValue } from '../../utils/assignments';
import { normalizeSearchText } from '../../utils/search';

export default function AssignmentForm({ classrooms, assignment, initialProblemIds, onSave, saving }) {
  const [title, setTitle] = useState(assignment?.title || '');
  const [description, setDescription] = useState(assignment?.description || '');
  const [classroomId, setClassroomId] = useState(assignment?.classroom_id?.toString() || classrooms[0]?.id?.toString() || '');
  const [dueAt, setDueAt] = useState(toDateTimeLocalValue(assignment?.due_at));
  const [published, setPublished] = useState(Boolean(assignment?.published));
  const [problems, setProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data, error } = await supabase
          .from('problems')
          .select('id, title, difficulty, xp_reward, chapter_id, category_id, chapters(title, section), categories(name)')
          .order('title', { ascending: true });

        if (error) throw error;
        const availableProblems = data || [];
        setProblems(availableProblems);

        const selected = (initialProblemIds || [])
          .map((problemId) => availableProblems.find((problem) => problem.id === problemId))
          .filter(Boolean);
        setSelectedProblems(selected);
      } catch (error) {
        setLoadError(error.message);
      } finally {
        setLoadingProblems(false);
      }
    };

    fetchProblems();
  }, [initialProblemIds]);

  const normalizedSearch = normalizeSearchText(search);
  const filteredProblems = problems
    .filter((problem) => normalizeSearchText(problem.title).includes(normalizedSearch))
    .filter((problem) => !selectedProblems.some((selected) => selected.id === problem.id))
    .slice(0, 30);

  const moveProblem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedProblems.length) return;

    setSelectedProblems((currentProblems) => {
      const nextProblems = [...currentProblems];
      [nextProblems[index], nextProblems[targetIndex]] = [nextProblems[targetIndex], nextProblems[index]];
      return nextProblems;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      title,
      description,
      classroomId,
      dueAt,
      published,
      selectedProblems,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
      <section className="space-y-5 rounded-2xl border border-border bg-ink p-6 lg:col-span-2">
        <div>
          <label htmlFor="assignment-title" className="mb-2 block text-sm font-bold text-text-main">Titlu *</label>
          <input id="assignment-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" placeholder="Recapitulare condiții" />
        </div>

        <div>
          <label htmlFor="assignment-classroom" className="mb-2 block text-sm font-bold text-text-main">Clasă *</label>
          <select id="assignment-classroom" value={classroomId} onChange={(event) => setClassroomId(event.target.value)} disabled={Boolean(assignment)} required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Alege clasa</option>
            {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
          </select>
          {assignment && <p className="mt-2 text-xs text-muted">Clasa unei teme nu poate fi schimbată după creare.</p>}
        </div>

        <div>
          <label htmlFor="assignment-description" className="mb-2 block text-sm font-bold text-text-main">Descriere</label>
          <textarea id="assignment-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" placeholder="Adaugă instrucțiuni pentru elevi..." />
        </div>

        <div>
          <label htmlFor="assignment-due-at" className="mb-2 block text-sm font-bold text-text-main">Deadline</label>
          <input id="assignment-due-at" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" />
          <p className="mt-2 text-xs text-muted">Lasă gol pentru o temă fără deadline.</p>
        </div>

        <button type="button" onClick={() => setPublished((current) => !current)} aria-pressed={published} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${published ? 'border-easy/30 bg-easy/10' : 'border-border bg-background'}`}>
          <span><span className="block font-bold text-text-main">{published ? 'Publicată' : 'Draft'}</span><span className="mt-1 block text-xs text-muted">{published ? 'Elevii din clasă pot vedea tema.' : 'Tema este vizibilă doar pentru tine.'}</span></span>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${published ? 'bg-easy text-ink' : 'border border-muted text-transparent'}`}><Check className="h-4 w-4" /></span>
        </button>
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-ink p-6 lg:col-span-3">
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <div><h2 className="font-bold text-text-main">Problemele temei</h2><p className="mt-1 text-sm text-muted">Ordinea de mai jos devine poziția fiecărei probleme.</p></div>
            <span className="rounded-md bg-accent/10 px-2 py-1 text-sm font-bold text-accent">{selectedProblems.length}</span>
          </div>
          <AssignmentProblemList problems={selectedProblems} editable onMove={moveProblem} onRemove={(problemId) => setSelectedProblems((currentProblems) => currentProblems.filter((problem) => problem.id !== problemId))} />
        </div>

        <div className="border-t border-border pt-5">
          <label htmlFor="problem-search" className="mb-2 block text-sm font-bold text-text-main">Adaugă probleme existente</label>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input id="problem-search" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-text-main outline-none transition-colors focus:border-accent" placeholder="Caută după titlu..." /></div>

          {loadingProblems ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div> : loadError ? <p className="mt-3 rounded-lg border border-hard/20 bg-hard/10 p-3 text-sm text-hard">{loadError}</p> : (
            <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-border">
              {filteredProblems.length === 0 ? <p className="p-4 text-center text-sm text-muted">Nu am găsit probleme disponibile.</p> : filteredProblems.map((problem) => (
                <button key={problem.id} type="button" onClick={() => setSelectedProblems((currentProblems) => [...currentProblems, problem])} className="flex w-full items-center gap-3 border-b border-border p-3 text-left last:border-b-0 hover:bg-sidebar-hover">
                  <span className="min-w-0 flex-1"><span className="block truncate font-bold text-text-main">{problem.title}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted"><span className={`rounded-md border px-2 py-0.5 font-bold ${getDifficultyClasses(problem.difficulty)}`}>{problem.difficulty || 'Mixt'}</span><span>{problem.xp_reward || 0} XP</span><span>{[problem.chapters?.title || problem.chapters?.section, problem.categories?.name].filter(Boolean).join(' · ')}</span></span></span>
                  <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-bold text-accent">Adaugă</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving || loadingProblems} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          {assignment ? 'Salvează modificările' : 'Creează tema'}
        </button>
      </section>
    </form>
  );
}
