import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { build } from '../backend/code-runner-api/node_modules/esbuild/lib/main.js';

// Render the real shared component with the same numbered, inline-code props
// used by SolutieTemaElev. No DB writes, browser credentials or live services.
const temporary = await mkdtemp(new URL('.submission-history-', import.meta.url));
try {
  const output = `${temporary}/render.mjs`;
  await build({
    stdin: {
      contents: `import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SubmittedSolutions from './src/components/profile/SubmittedSolutions.jsx';
export function render(status) {
  return renderToStaticMarkup(<SubmittedSolutions submissions={[{
    submission_id: 5, submission_number: 5, submission_status: status,
    source_code: 'x = int(input())\\ny = bin(x)[2::hhgd\\nprint(y)',
    submitted_at: '2026-09-12T00:31:00Z', runtime_ms: 1035, memory_kb: 53146
  }]} showProblemTitle={false} codePresentation="inline" />);
}`,
      resolveDir: process.cwd(), loader: 'jsx',
    },
    outfile: output, bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic',
  });
  const { render } = await import(pathToFileURL(output));
  for (const [status, label] of [
    ['accepted', 'Soluție acceptată'], ['wrong_answer', 'Răspuns greșit'],
    ['runtime_error', 'Eroare de execuție'], ['compile_error', 'Eroare de sintaxă'],
    ['time_limit', 'Limită de timp depășită'], ['memory_limit', 'Limită de memorie depășită'],
    ['internal_error', 'Eroare la evaluare'], ['unknown_status', 'Eroare la evaluare'],
    ['tle', 'Limită de timp depășită'], ['time_limit_exceeded', 'Limită de timp depășită'],
    ['memory_limit_exceeded', 'Limită de memorie depășită'],
  ]) {
    test(`teacher submission card: ${status}`, () => {
      const html = render(status);
      assert.ok(html.includes('Submission 5'));
      assert.ok(html.includes(label));
      if (status !== 'wrong_answer') assert.ok(!html.includes('Răspuns greșit'));
      assert.ok(!html.includes('Problemă rezolvată'));
    });
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
