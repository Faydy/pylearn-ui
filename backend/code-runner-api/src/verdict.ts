export type Verdict = 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error' | 'time_limit' | 'memory_limit' | 'internal_error';

// Judge0 CE: https://ce.judge0.com/#statuses
export function executionVerdict(result: { status?: { id: number }; stderr?: string | null; compile_output?: string | null }): Verdict {
  const id = result.status?.id;
  if (id === 3) return 'accepted';
  if (id === 4) return 'wrong_answer';
  if (id === 5) return 'time_limit';
  if (id === 6) return 'compile_error';
  if (id && id >= 7 && id <= 12) {
    const diagnostic = result.stderr || result.compile_output || '';
    if (/^(SyntaxError|IndentationError|TabError):/m.test(diagnostic)) return 'compile_error';
    if (/^MemoryError(?::|$)/m.test(diagnostic)) return 'memory_limit';
    return 'runtime_error';
  }
  // Includes internal/exec-format errors, malformed results and unfinished jobs.
  return 'internal_error';
}

// Never forward arbitrary exception text: even str(input()) can leak a hidden
// test through ValueError/KeyError or a user-raised exception. Return constants.
export function safeErrorDetails(verdict: Verdict, diagnostic: string): string | null {
  if (verdict !== 'runtime_error' && verdict !== 'compile_error') return null;
  const summaries: Record<string, string> = {
    ZeroDivisionError: 'ZeroDivisionError: division by zero',
    IndexError: 'IndexError: index out of range',
    NameError: 'NameError: nume nedefinit',
    SyntaxError: 'SyntaxError: sintaxă invalidă',
    IndentationError: 'IndentationError: indentare incorectă',
    TabError: 'TabError: taburi și spații inconsistente',
    TypeError: 'TypeError', ValueError: 'ValueError', KeyError: 'KeyError',
    RecursionError: 'RecursionError', AssertionError: 'AssertionError',
  };
  const names = diagnostic.match(/^([A-Za-z]+Error)(?::|$)/gm) || [];
  return summaries[names.at(-1)?.replace(/:$/, '') || ''] || null;
}
