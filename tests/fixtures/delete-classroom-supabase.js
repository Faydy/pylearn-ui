// Disposable browser-only state. This adapter never contacts Supabase.
export let viewer = 'owner';
export const setViewer = (value) => { viewer = value; };
export let simulateFailure = false;
export const setFailure = (value) => { simulateFailure = value; };
let deleted = false;
export const resetFixture = () => { deleted = false; };
const classroom = { id: 1, name: 'Clasa IX A', description: 'Clasă pentru verificarea ștergerii.', teacher_id: 'owner', teacher_username: 'Profesor', join_code: 'ABC234', student_count: 1, archived: false };
export const supabase = {
  async rpc(name, args) {
    if (name === 'delete_classroom') {
      if (viewer !== 'owner') return { error: { message: 'Clasa nu există sau nu ai permisiunea să o ștergi.' } };
      if (args.p_confirmation_name !== classroom.name) throw new Error('Confirmare incorectă în test');
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (simulateFailure) return { error: { code: 'P0001', message: 'Clasa nu poate fi ștearsă deoarece există date asociate care împiedică ștergerea.' } };
      deleted = true;
      return { data: null, error: null };
    }
    if (name === 'get_classroom_details') return deleted || viewer === 'other' ? { error: { message: 'Nu ai acces la această clasă.' } } : { data: [classroom] };
    if (name === 'get_classroom_members') return { data: [] };
    throw new Error(`Unexpected fixture RPC: ${name}`);
  },
  from(table) {
    const query = {
      select() { return query; }, eq() { return query; }, in() { return query; }, order() { return query; },
      then(resolve) { return Promise.resolve({ data: table === 'classrooms' && !deleted ? [classroom] : [], error: null }).then(resolve); },
    };
    return query;
  },
};
