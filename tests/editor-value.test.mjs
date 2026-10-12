import assert from 'node:assert/strict';
import test from 'node:test';
import { EditorState } from '@codemirror/state';
import { editorValueChange } from '../src/utils/editorEnvironment.js';

test('controlled updates preserve exact whitespace, empty values and Unicode', () => {
  const values = ['', 'print("Salut")', 'a = 5\nb = 7\nprint(a + b)', 'for i in range(3):\n    print(i)', '\n  x = "😀 Salut"  \n\n'];
  for (const current of values) for (const next of values) {
    const change = editorValueChange(current, next);
    if (current === next) assert.equal(change, null);
    else assert.equal(EditorState.create({ doc: current }).update({ changes: change }).state.doc.toString(), next);
  }
});

test('external changes map the cursor and preserve unchanged content', () => {
  const state = EditorState.create({ doc: 'print(1)\nprint(2)', selection: { anchor: 14 } });
  const change = editorValueChange(state.doc.toString(), '# note\nprint(1)\nprint(2)');
  assert.deepEqual(change, { from: 0, to: 0, insert: '# note\n' });
  const next = state.update({ changes: change }).state;
  assert.equal(next.selection.main.head, 21);
});
