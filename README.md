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

## Syntax Overview

Coco syntax is designed to be compact, readable, and friendly to both humans
and tools. It learns from Python indentation, Ruby scripting ergonomics,
CoffeeScript concision, Go's small surface area, and TypeScript/Babel-style AST
compatibility without copying any one language wholesale.

```coco
const version = "0.1"

fn greet name
  print "Hello {name}"

if version == "0.1"
  greet "Coco"
else
  print "Unknown version"
```

Current language milestone:

- Indentation defines blocks through explicit `INDENT` and `DEDENT` tokens.
- No semicolons are required.
- Identifiers, keywords, strings, string templates, numbers, comments,
  operators, and punctuation are tokenized.
- `true`, `false`, and `null` are literal tokens.
- `and`, `or`, and `not` are word operators; symbolic forms are also accepted.
- Parser, AST, transform, and emitter are planned next stages.

The implemented compiler surface is intentionally honest: Coco currently has a
tested lexer and REPL tokenization environment, not a complete compiler yet.

## Runtime Overview

Coco Runtime is an optional layer for application orchestration. It is separated
from the language core so users can install only the language tools, or opt into
runtime support when they want Web/API/Agent/Workflow/Desktop/Game planning.

```text
Language core:
  tokenize(source)
  lexer tokens
  future parser / AST / emitter

Optional runtime:
  manifest parser
  engine descriptors
  event bus
  scheduler
  plugin registry
```

Runtime 1.0 is manifest-driven because the Coco parser is not implemented yet.
Future `.coco` runtime syntax should compile into the same manifest model.

```bash
coco runtime plan examples/runtime/agent-web.json
coco runtime dev examples/runtime/agent-web.json --dry-run
```

The package boundary is explicit:

```ts
import { tokenize } from "coco-lang";
import { CocoRuntime } from "coco-lang/runtime";
```

Real adapters such as OpenAI, Redis, PixiJS, Tauri, HTTP servers, and database
drivers are future optional plugins rather than language-core dependencies.

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
  runtime/        Optional runtime base
  token.ts        Token types, keyword table, syntax error

tests/
  cli.test.ts     CLI and REPL tests
  lexer.test.ts   Lexer behavior tests
  runtime*.test.ts Runtime API and CLI tests

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
