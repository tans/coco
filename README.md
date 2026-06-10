# Coco

Coco is a Bun-native language prototype that compiles indentation-based `.coco`
source toward modern JavaScript. The current milestone is **Coco Lexer 1.0**:
it turns source text into a typed token stream with Python-style indentation.

```text
.coco
  -> Lexer
Token Stream
  -> Parser
AST
  -> Transform
JS AST
  -> Emit
ES2023
```

## Status

Implemented:

- `tokenize(source)` Lexer API
- `cococ lex <file.coco>` CLI command
- `coco` REPL and `coco runtime ...` optional runtime commands
- Keyword, identifier, number, string, string-template, comment, operator, and
  punctuation tokens
- `NEWLINE`, `INDENT`, and `DEDENT` layout tokens
- Source locations for diagnostics
- Bun test coverage for the lexer
- Optional runtime base with manifest planning, event bus, scheduler, and plugin registry
- Documentation, tutorial, example programs, runtime guide, and static project page

Planned:

- Parser and Babel-like Coco AST
- Transform from Coco AST to JavaScript AST
- ES2023 emitter

## Requirements

- Bun `>= 1.3.0`

Install dependencies:

```bash
bun install
```

## Usage

Start the REPL:

```bash
coco
```

REPL commands:

```text
.help     Show REPL help
.paste    Enter multi-line input mode
.tokens   Toggle compact token output and JSON token output
.clear    Clear the current multi-line input buffer
.exit     Exit the REPL
```

Tokenize a file:

```bash
bun run src/cli.ts lex examples/hello.coco
coco lex examples/hello.coco
```

Inspect an optional runtime manifest:

```bash
coco runtime plan examples/runtime/agent-web.json
coco runtime dev examples/runtime/agent-web.json --dry-run
```

Install the CLI globally from this checkout:

```bash
bun run install:global
coco
coco lex examples/hello.coco
```

`cococ` is kept as a compiler-style alias for the same executable.

If `coco` is not found after installation, add Bun's global bin directory to
your shell profile:

```bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Use the library API:

```ts
import { tokenize } from "./src";

const tokens = tokenize('const name = "Coco"\n');
console.log(tokens);
```

Use the optional runtime API explicitly:

```ts
import { CocoRuntime, parseRuntimeManifest } from "./src/runtime";
```

## Scripts

```bash
bun test          # run lexer tests
bun run test:page # smoke-test the static page; requires page server + Chrome
bun run build    # bundle language, CLI, and runtime entries into dist/
bun run check    # type-check with tsc
```

The static project page can be opened directly:

```text
page/index.html
```

Or served locally:

```bash
bunx serve page -l tcp://127.0.0.1:4173
COCO_PAGE_URL=http://127.0.0.1:4173 bun run test:page
```

## Project Structure

```text
src/
  cli.ts          CLI entry point
  index.ts        Public API exports
  lexer.ts        Coco Lexer 1.0 implementation
  token.ts        Token types, keyword table, syntax error

tests/
  lexer.test.ts   Lexer behavior tests

docs/
  architecture.md Compiler pipeline and module boundaries
  lexer.md        Token reference and layout rules
  runtime.md      Optional runtime architecture and commands
  tutorial.md     First steps with Coco syntax
  roadmap.md      MVP scope and non-goals

examples/
  hello.coco      Small Coco source sample

page/
  index.html      Static documentation page
  styles.css      Page design system
  script.js       Token reference interactions
```

## Documentation

- [Architecture](docs/architecture.md)
- [Lexer Reference](docs/lexer.md)
- [Tutorial](docs/tutorial.md)
- [Runtime](docs/runtime.md)
- [Examples](docs/examples.md)
- [Diagnostics](docs/diagnostics.md)
- [Testing](docs/testing.md)
- [Roadmap](docs/roadmap.md)
- [Design Influences](docs/design-influences.md)
- [Agent Guide](Agent.md)
- [LLM Project Map](llms.txt)
- [Target](target.md)

## License

MIT
