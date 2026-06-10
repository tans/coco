# Testing

The test suite uses `bun:test`.

```bash
bun test
```

Global command smoke check:

```bash
bun run install:global
PATH="$HOME/.bun/bin:$PATH" printf '.exit\n' | coco
PATH="$HOME/.bun/bin:$PATH" coco lex examples/hello.coco
```

The static page smoke test expects the page to be served and uses the system
Chrome channel through Playwright:

```bash
bunx serve page -l tcp://127.0.0.1:4173
COCO_PAGE_URL=http://127.0.0.1:4173 bun run test:page
```

## Coverage Areas

`tests/lexer.test.ts` covers:

- Keywords, identifiers, booleans, and null
- Integer, float, and scientific numbers
- Source locations
- Python-style indentation
- Nested blocks and multiple `DEDENT` tokens
- Tab indentation using eight-column stops
- Single-line and multi-line comments
- Plain strings, multi-line strings, and `STRING_TEMPLATE`
- Symbol and word operators
- Suppressed layout tokens inside brackets
- Diagnostics for inconsistent indentation, unterminated strings, unterminated
  comments, and unexpected characters

`tests/page-smoke.mjs` covers:

- Page title and hero identity
- Token preview interaction
- Console error/warning health
- Static page URL override through `COCO_PAGE_URL`

`tests/runtime.test.ts` and `tests/runtime-cli.test.ts` cover:

- Runtime manifest parsing and validation
- Built-in engine planning
- Plugin capability merging
- Event bus dispatch
- Scheduler ordering
- `coco runtime plan`
- `coco runtime dev --dry-run`

## Adding Tests

Add tests when:

- A new token type is introduced
- A token value or lexeme rule changes
- A diagnostic is added or changed
- Indentation behavior changes
- A future parser consumes a previously ambiguous token sequence

Prefer testing token `type` sequences for layout behavior and full token objects
when source locations or literal values matter.
