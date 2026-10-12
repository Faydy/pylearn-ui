// Primary pointer, not `any-pointer`: a laptop with a touchscreen and mouse
// stays on Monaco. Touch-first tablets keep CodeMirror in landscape as well.
export const MOBILE_EDITOR_QUERY = '(pointer: coarse) and (hover: none), (pointer: coarse) and (max-width: 767px)';

// Replace only the changed span when React supplies a reset/draft update.
// This lets CodeMirror map its selection rather than resetting its whole state.
export function editorValueChange(current, next) {
  if (current === next) return null;
  let from = 0;
  while (from < current.length && from < next.length && current[from] === next[from]) from++;
  let end = current.length;
  let nextEnd = next.length;
  while (end > from && nextEnd > from && current[end - 1] === next[nextEnd - 1]) { end--; nextEnd--; }
  return { from, to: end, insert: next.slice(from, nextEnd) };
}
