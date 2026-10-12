import { useEffect, useLayoutEffect, useRef } from 'react';
import { Annotation, Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, defaultHighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { markdown } from '@codemirror/lang-markdown';
import { autocompletion, closeCompletion, completionKeymap, completeFromList, snippetCompletion } from '@codemirror/autocomplete';
import { BUILT_INS, KEYWORDS, SNIPPETS } from '../utils/pythonCompletions';
import { editorValueChange } from '../utils/editorEnvironment';

const externalValue = Annotation.define();
const pythonSuggestions = completeFromList([
  ...BUILT_INS.map(([label, info]) => snippetCompletion(`${label}(\${1})`, { label, info, type: 'function' })),
  ...KEYWORDS.map(label => ({ label, type: 'keyword' })),
  ...SNIPPETS.map(([label, template, info]) => snippetCompletion(template, { label, info, type: 'snippet' })),
]);

function configuration({ language, theme, options, autocompleteEnabled }) {
  const dark = theme !== 'light';
  return [
    language === 'markdown' ? markdown() : language === 'python' ? python() : [],
    EditorState.readOnly.of(Boolean(options.readOnly)),
    // Keep read-only content focusable/selectable for native Copy on mobile.
    EditorView.editable.of(!options.readOnly),
    EditorView.contentAttributes.of({
      'aria-label': options.ariaLabel ?? 'Editor de cod',
      'aria-readonly': String(Boolean(options.readOnly)),
      tabindex: '0', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false',
    }),
    options.lineNumbers === 'off' ? [] : lineNumbers(),
    options.wordWrap === 'on' ? EditorView.lineWrapping : [],
    indentUnit.of(' '.repeat(options.tabSize ?? 4)),
    EditorState.tabSize.of(options.tabSize ?? 4),
    options.readOnly ? [] : autocompletion({
      activateOnTyping: autocompleteEnabled,
      override: language === 'python' ? [pythonSuggestions] : undefined,
    }),
    EditorView.theme({
      '&': { height: '100%', color: dark ? '#d4d4d4' : '#17212b', backgroundColor: dark ? '#1e1e1e' : '#ffffff', fontSize: `${Math.max(16, options.fontSize ?? 16)}px` },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': { overflow: 'auto', fontFamily: options.fontFamily ?? "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", lineHeight: '1.5' },
      '.cm-content': { padding: `${options.padding?.top ?? 16}px 0 ${options.padding?.bottom ?? 16}px`, caretColor: dark ? '#ffffff' : '#17212b' },
      '.cm-gutters': { backgroundColor: dark ? '#1e1e1e' : '#ffffff', color: dark ? '#858585' : '#68717b', border: 'none' },
      '.cm-activeLine': { backgroundColor: dark ? '#ffffff08' : '#00000005' },
      '.cm-content ::selection': { backgroundColor: dark ? '#264f78' : '#add6ff' },
      '.cm-tooltip': { backgroundColor: dark ? '#252526' : '#ffffff', color: dark ? '#d4d4d4' : '#17212b', border: '1px solid #68717b' },
      '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: dark ? '#264f78' : '#add6ff', color: 'inherit' },
    }, { dark }),
  ];
}

export default function MobileCodeEditor({ value = '', onChange, language, defaultLanguage = 'python', theme = 'vs-dark', height = '100%', width = '100%', options = {}, autocompleteEnabled = true }) {
  const host = useRef(null);
  const view = useRef(null);
  const callback = useRef(onChange);
  const settings = useRef(new Compartment());
  const latest = useRef(null);
  const config = { language: language ?? defaultLanguage, theme, options, autocompleteEnabled };
  useLayoutEffect(() => { callback.current = onChange; latest.current = { value, config }; });

  useEffect(() => {
    const initial = latest.current;
    const instance = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.value,
        extensions: [
          history(), indentOnInput(), bracketMatching(), highlightActiveLine(),
          syntaxHighlighting(defaultHighlightStyle),
          keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          settings.current.of(configuration(initial.config)),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !update.transactions.every(tr => tr.annotation(externalValue))) {
              callback.current?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    view.current = instance;
    return () => { view.current = null; instance.destroy(); };
  }, []);

  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    const change = editorValueChange(instance.state.doc.toString(), value);
    if (change) instance.dispatch({ changes: change, annotations: externalValue.of(true) });
  }, [value]);

  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    instance.dispatch({ effects: settings.current.reconfigure(configuration({ language: language ?? defaultLanguage, theme, options, autocompleteEnabled })) });
    if (!autocompleteEnabled || options.readOnly) closeCompletion(instance);
  }, [language, defaultLanguage, theme, options, autocompleteEnabled]);

  return <div ref={host} data-code-editor="codemirror" style={{ height, width, minWidth: 0 }} />;
}
