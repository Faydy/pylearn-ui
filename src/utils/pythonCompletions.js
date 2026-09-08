const BUILT_INS = [
    ['print', 'Afișează valori în consolă.'],
    ['input', 'Citește o linie de la intrarea standard.'],
    ['int', 'Convertește o valoare într-un număr întreg.'],
    ['range', 'Generează o secvență de numere întregi.'],
    ['len', 'Returnează numărul de elemente.'],
    ['float', 'Convertește o valoare într-un număr real.'],
    ['str', 'Convertește o valoare într-un șir de caractere.'],
    ['bool', 'Convertește o valoare în True sau False.'],
    ['list', 'Construiește o listă.'],
    ['tuple', 'Construiește un tuplu.'],
    ['set', 'Construiește o mulțime de elemente distincte.'],
    ['dict', 'Construiește un dicționar.'],
    ['sum', 'Calculează suma elementelor unui iterabil.'],
    ['min', 'Returnează cea mai mică valoare.'],
    ['max', 'Returnează cea mai mare valoare.'],
    ['abs', 'Returnează valoarea absolută a unui număr.'],
    ['round', 'Rotunjește un număr.'],
    ['sorted', 'Returnează o listă nouă, sortată.'],
    ['enumerate', 'Asociază fiecărui element un indice.'],
    ['zip', 'Grupează elementele de pe aceleași poziții din mai multe iterabile.'],
    ['map', 'Aplică o funcție elementelor unui iterabil.'],
    ['filter', 'Selectează elementele care îndeplinesc o condiție.'],
    ['any', 'Verifică dacă cel puțin un element are valoare logică adevărată.'],
    ['all', 'Verifică dacă toate elementele au valoare logică adevărată.'],
];

const KEYWORDS = [
    'if', 'elif', 'else', 'for', 'while', 'def', 'return', 'break', 'continue',
    'import', 'from', 'as', 'in', 'not', 'and', 'or', 'True', 'False', 'None',
    'try', 'except', 'finally', 'with', 'class', 'pass',
];

const SNIPPETS = [
    ['for', 'for ${1:i} in range(${2:n}):\n\t${3:pass}', 'Buclă for cu range.'],
    ['if', 'if ${1:condition}:\n\t${2:pass}', 'Bloc condițional if.'],
    ['while', 'while ${1:condition}:\n\t${2:pass}', 'Buclă while.'],
    ['def', 'def ${1:function_name}(${2}):\n\t${3:pass}', 'Definește o funcție.'],
    ['forrange', 'for ${1:i} in range(${2:n}):\n\t${3:pass}', 'Parcurge o secvență de numere.'],
    ['readint', '${1:n} = int(input())', 'Citește un număr întreg.'],
    ['readints', '${1:a} = list(map(int, input().split()))', 'Citește o listă de numere întregi separate prin spații.'],
];

const METHODS = [
    ['append', 'Adaugă un element la sfârșitul unei liste.'],
    ['pop', 'Elimină și returnează un element.'],
    ['sort', 'Sortează o listă pe loc.'],
    ['reverse', 'Inversează ordinea elementelor unei liste pe loc.'],
    ['split', 'Împarte un șir în subșiruri.'],
    ['strip', 'Elimină spațiile sau caracterele indicate de la capetele unui șir.'],
    ['lower', 'Returnează un șir cu litere mici.'],
    ['upper', 'Returnează un șir cu litere mari.'],
    ['replace', 'Înlocuiește aparițiile unui subșir.'],
    ['join', 'Unește șiruri folosind un separator.'],
    ['count', 'Numără aparițiile unei valori.'],
    ['index', 'Returnează poziția primei apariții a unei valori.'],
];

export function registerPythonCompletionProvider(monaco) {
    const { CompletionItemKind: Kind, CompletionItemInsertTextRule: Rule } = monaco.languages;
    const functions = BUILT_INS.map(([label, documentation], index) => ({
        label,
        kind: Kind.Function,
        insertText: `${label}(\${1})`,
        insertTextRules: Rule.InsertAsSnippet,
        documentation,
        sortText: `0_${String(index).padStart(2, '0')}`,
    }));
    const keywords = KEYWORDS.map((label) => ({
        label, kind: Kind.Keyword, insertText: label,
        detail: 'Cuvânt-cheie Python', sortText: `1_${label}`,
    }));
    const snippets = SNIPPETS.map(([label, insertText, documentation]) => ({
        label: { label, description: 'șablon' },
        kind: Kind.Snippet,
        insertText,
        insertTextRules: Rule.InsertAsSnippet,
        documentation,
        sortText: `2_${label}`,
    }));
    const methods = METHODS.map(([label, documentation]) => ({
        label,
        kind: Kind.Method,
        insertText: `${label}(\${1})`,
        insertTextRules: Rule.InsertAsSnippet,
        detail: 'Metodă Python — verifică tipul obiectului',
        documentation,
        sortText: `0_${label}`,
    }));
    const globals = [...functions, ...keywords, ...snippets];

    // The provider stays registered while OFF: Monaco options control automatic
    // triggering, so Ctrl+Space works without capturing React toggle state.
    return monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.'],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };
            const beforeWord = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1);
            // After a dot, offer common methods without inferring the object's type.
            const items = beforeWord.endsWith('.') ? methods : globals;
            const suggestions = items.map((item) => ({ ...item, range }));

            // A Python-specific provider takes priority over Monaco's fallback word
            // provider. Merge current-document words so identifiers still appear,
            // even when their prefix also matches a built-in. Kind.Text obeys the
            // existing suggest.showWords toggle; Monaco handles filtering/ranking.
            const seen = new Set(items.map((item) => typeof item.label === 'string' ? item.label : item.label.label));
            seen.add(word.word);
            for (const [label] of model.getValue().matchAll(/[\p{L}_][\p{L}\p{N}\p{M}_]*/gu)) {
                if (seen.has(label)) continue;
                seen.add(label);
                suggestions.push({
                    label, kind: Kind.Text, insertText: label, range,
                    detail: 'Cuvânt din documentul curent', sortText: `3_${label}`,
                });
            }
            return { suggestions };
        },
    });
}
