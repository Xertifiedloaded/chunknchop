#!/usr/bin/env bash


set -euo pipefail

command -v python3 >/dev/null 2>&1 || { echo "python3 is required" >&2; exit 1; }

python3 - "$@" <<'PY'
import os, re, sys

EXTS = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'}
JSX_EXTS = {'.tsx', '.jsx', '.js', '.mjs', '.cjs'}
SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt',
             'coverage', '.turbo', '.cache', '.svelte-kit', 'vendor'}

# // comments matching any of these are preserved.
KEEP_LINE_PATTERNS = [
    r'^///\s*<\s*(reference|amd-module|amd-dependency)\b',
    r'^//+\s*@ts-',
    r'^//+\s*@(jsx|jsxImportSource|jsxFrag|jsxRuntime|flow|license|preserve|vitest|jest-environment)\b',
    r'^//+\s*(eslint|prettier-ignore|biome-ignore|tslint|istanbul|c8\b|v8 ignore|deno-lint|oxlint)',
    r'^//+\s*#\s*(end)?region\b',
    r'^//[#@]\s*sourceMappingURL',
    r'^//[#@]\s*sourceURL',
]
# /* */ comments: matched against the inner text (delimiters and leading * removed).
KEEP_BLOCK_PATTERNS = [
    r'^!',                                                        # /*! license banners */
    r'@(license|preserve|jsxImportSource|jsxFrag|jsxRuntime|jsx|flow|vite-ignore|'
    r'vitest-environment|jest-environment|ts-[\w-]+)\b',
    r'^(eslint|prettier-ignore|biome-ignore|tslint|istanbul|c8\b|v8 ignore|deno-lint|oxlint)',
    r'^#\s*(end)?region\b',
    r'^webpack\w+\s*:',                                           # webpackChunkName: "x"
    r'[@#]__(PURE|NO_SIDE_EFFECTS|INLINE|NOINLINE)__',
]
KEEP_LINE = [re.compile(p, re.I) for p in KEEP_LINE_PATTERNS]
KEEP_BLOCK = [re.compile(p, re.I) for p in KEEP_BLOCK_PATTERNS]

REGEX_PREV = set('(,=:[!&|?{};+-*%<>~^')
REGEX_KW = {'return', 'typeof', 'case', 'in', 'of', 'delete', 'void',
            'throw', 'new', 'else', 'do', 'yield', 'await'}
# If `{` follows one of these, it's a JS block, not a JSX expression container.
JS_BLOCK_PREV = set(')=;,:([')
JS_BLOCK_KW = {'else', 'try', 'finally', 'do', 'static'}


def keep(text, kind):
    if kind == 'line':
        return any(p.search(text) for p in KEEP_LINE)
    inner = re.sub(r'^/\*+|\*+/$', '', text).strip()
    return any(p.search(inner) for p in KEEP_BLOCK)


def is_jsx_container(src, k, comment_end, jsx):
    """src[k] == '{' directly before a block comment. True if this is `{/* */}` in JSX."""
    if not jsx:
        return None
    n = len(src)
    m = comment_end
    while m < n and src[m].isspace():
        m += 1
    if m >= n or src[m] != '}':
        return None
    p = k - 1
    while p >= 0 and src[p].isspace():
        p -= 1
    if p < 0:
        return None
    prev = src[p]
    if prev in JS_BLOCK_PREV or prev == '{':
        return None
    if prev == '>' and p > 0 and src[p - 1] == '=':      # arrow function body
        return None
    w = re.search(r'[A-Za-z_$][\w$]*$', src[max(0, p - 12):p + 1])
    if w and w.group(0) in JS_BLOCK_KW:
        return None
    return m + 1


def find_comments(src, jsx):
    """Return list of (start, end, kind, text). kind: 'line' | 'block' | 'jsx'."""
    spans = []
    n = len(src)
    i = 0
    last = ''
    tstack = []
    in_tmpl = False

    while i < n:
        if in_tmpl:
            c = src[i]
            if c == '\\':
                i += 2
            elif c == '`':
                in_tmpl = False
                last = '"'
                i += 1
            elif c == '$' and i + 1 < n and src[i + 1] == '{':
                tstack.append(0)
                in_tmpl = False
                last = '{'
                i += 2
            else:
                i += 1
            continue

        c = src[i]
        nx = src[i + 1] if i + 1 < n else ''

        if c == '/' and nx == '/':
            j = src.find('\n', i)
            if j == -1:
                j = n
            end = j
            if end > i and src[end - 1] == '\r':
                end -= 1
            spans.append((i, end, 'line', src[i:end]))
            i = j
            continue

        if c == '/' and nx == '*':
            j = src.find('*/', i + 2)
            ce = n if j == -1 else j + 2
            text = src[i:ce]
            # Is this `{/* ... */}` (JSX expression container)?
            k = i - 1
            while k >= 0 and src[k].isspace():
                k -= 1
            if k >= 0 and src[k] == '{':
                close = is_jsx_container(src, k, ce, jsx)
                if close:
                    spans.append((k, close, 'jsx', text))
                    i = close
                    last = '}'
                    continue
            spans.append((i, ce, 'block', text))
            i = ce
            continue

        if c in '"\'':
            q = c
            i += 1
            while i < n and src[i] != q and src[i] != '\n':
                i += 2 if src[i] == '\\' else 1
            i += 1
            last = '"'
            continue

        if c == '`':
            in_tmpl = True
            i += 1
            continue

        if c == '/':
            is_regex = last == '' or last in REGEX_PREV
            if jsx and last == '<':                 # closing tag </div>, not a regex
                is_regex = False
            if not is_regex and (last.isalnum() or last in '_$'):
                m = re.search(r'[A-Za-z_$][\w$]*$', src[max(0, i - 12):i].rstrip())
                is_regex = bool(m and m.group(0) in REGEX_KW)
            if is_regex:
                i += 1
                in_class = False
                while i < n and src[i] != '\n':
                    ch = src[i]
                    if ch == '\\':
                        i += 2
                        continue
                    if ch == '[':
                        in_class = True
                    elif ch == ']':
                        in_class = False
                    elif ch == '/' and not in_class:
                        break
                    i += 1
                i += 1
                while i < n and (src[i].isalpha()):
                    i += 1
                last = '"'
                continue

        if c == '{' and tstack:
            tstack[-1] += 1
        elif c == '}' and tstack:
            if tstack[-1] == 0:
                tstack.pop()
                in_tmpl = True
                i += 1
                continue
            tstack[-1] -= 1

        if not c.isspace():
            last = c
        i += 1

    return spans


def is_word(ch):
    return bool(ch) and (ch.isalnum() or ch in '_$')


def process(path):
    try:
        with open(path, encoding='utf-8', newline='') as f:
            src = f.read()
    except (UnicodeDecodeError, OSError):
        return None

    jsx = os.path.splitext(path)[1].lower() in JSX_EXTS
    removed = []   # (line_no, text)
    edits = []     # (start, end, replacement)
    n = len(src)

    for start, end, kind, text in find_comments(src, jsx):
        if keep(text, kind):
            continue
        line_no = src.count('\n', 0, start) + 1
        first = text.strip().splitlines()[0] if text.strip() else text
        if '\n' in text.strip():
            first += ' …'
        removed.append((line_no, ('{' + first + '}') if kind == 'jsx' else first))

        line_start = src.rfind('\n', 0, start) + 1
        nl = src.find('\n', end)
        line_end = n if nl == -1 else nl
        before_blank = src[line_start:start].strip() == ''
        after_blank = src[end:line_end].strip() == ''

        # Comment is alone on its line(s): delete the whole line(s).
        if before_blank and after_blank:
            edits.append((line_start, n if nl == -1 else nl + 1, ''))
            continue

        if kind == 'jsx':
            # Remove only the {/* */} container; leave surrounding JSX text untouched.
            edits.append((start, end, ''))
            continue

        s2 = start
        while s2 > line_start and src[s2 - 1] in ' \t':
            s2 -= 1
        after_i = end
        while after_i < n and src[after_i] in ' \t':
            after_i += 1
        before_ch = src[s2 - 1] if s2 > line_start else ''
        after_ch = src[after_i] if after_i < n else ''

        if kind == 'line':
            edits.append((s2, end, ''))
        elif before_ch == '' or before_ch in '([{':
            edits.append((start, after_i, ''))
        elif after_ch == '' or after_ch in ')]},;\r\n':
            edits.append((s2, end, ''))
        elif s2 == start and after_i == end and is_word(before_ch) and is_word(after_ch):
            edits.append((start, end, ' '))          # avoid gluing tokens together
        elif s2 < start and after_i > end:
            edits.append((s2, end, ''))              # spaces on both sides: drop one set
        else:
            edits.append((start, end, ''))

    if not edits:
        return removed, src, src

    out, cursor = [], 0
    for s, e, repl in sorted(edits):
        if e <= cursor:
            continue
        if s < cursor:
            s = cursor
        out.append(src[cursor:s])
        out.append(repl)
        cursor = e
    out.append(src[cursor:])
    return removed, src, ''.join(out)


def main():
    args = sys.argv[1:]
    apply = '--apply' in args
    paths = [a for a in args if not a.startswith('--')] or ['.']

    files = []
    for p in paths:
        if os.path.isfile(p):
            files.append(p)
            continue
        for root, dirs, names in os.walk(p):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for name in names:
                if os.path.splitext(name)[1].lower() in EXTS and not name.endswith('.d.ts.map'):
                    files.append(os.path.join(root, name))

    total_files = total_comments = 0
    for path in sorted(files):
        res = process(path)
        if not res:
            continue
        removed, old, new = res
        if not removed:
            continue
        total_files += 1
        total_comments += len(removed)
        print(f'\n{path}  ({len(removed)} comment{"s" if len(removed) != 1 else ""})')
        for line_no, text in removed:
            print(f'  - L{line_no}: {text.strip()}')
        if apply and new != old:
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(new)

    mode = 'APPLIED' if apply else 'DRY RUN (no files changed, pass --apply to write)'
    print(f'\n[{mode}] {total_comments} comment(s) in {total_files} file(s)')


main()
PY