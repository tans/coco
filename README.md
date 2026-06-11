# Coco

Coco is a small, indentation-based language for Bun. It is designed to feel
lightweight like a script, structured like Python, and ready for modern
JavaScript tooling.

```coco
const version = "0.1"

fn greet name
  print "Hello {name}"

if version == "0.1"
  greet "Coco"
else
  print "Unknown version"
```

Coco is early. Today it ships a tested lexer, a REPL, a CLI, examples, docs,
and an optional runtime planning layer.

## Try It

```bash
bun install
bun run install:global
coco
```

In the REPL:

```text
coco> const name = "Coco"
KEYWORD("const") IDENTIFIER("name") ASSIGN("=") STRING("\"Coco\"") NEWLINE("\n")
```

Multi-line input:

```text
coco> .paste
... if ok
...   print "yes"
...
KEYWORD("if") IDENTIFIER("ok") NEWLINE("\n") INDENT IDENTIFIER("print") STRING("\"yes\"") NEWLINE("\n") DEDENT
```

Useful REPL commands:

```text
.paste    multi-line input
.tokens   toggle JSON token output
.clear    clear input buffer
.help     show help
.exit     exit
```

## Lex a File

```bash
coco lex examples/hello.coco
```

Or without installing globally:

```bash
bun run src/cli.ts lex examples/hello.coco
```

## The Sweet Part

Readable blocks:

```coco
if user.active and not user.banned
  print "Welcome {user.name}"
```

Functions without ceremony:

```coco
fn add a b
  return a + b
```

Arrays and object-like layout:

```coco
users = [
  "Tom"
  "Jerry"
  "Lucy"
]

profile =
  name: "Tom"
  age: 18
```

Optional chaining and modern operators:

```coco
avatar = user?.profile?.avatar
double = (x) => x * 2
```

## Runtime Preview

Coco Runtime is optional. The language core stays separate, and runtime support
is loaded only when you ask for it.

```bash
coco runtime plan examples/runtime/agent-web.json
coco runtime dev examples/runtime/agent-web.json --dry-run
```

The current runtime layer plans apps across engines such as:

```text
web api agent workflow queue db ui desktop game
```

It does not bundle heavy adapters yet. OpenAI, Redis, PixiJS, Tauri, HTTP
servers, and database drivers are intended to become optional plugins.

## Use as a Library

Language core:

```ts
import { tokenize } from "coco-lang";

const tokens = tokenize('const name = "Coco"\n');
```

Runtime layer:

```ts
import { CocoRuntime, parseRuntimeManifest } from "coco-lang/runtime";
```

## Install Notes

Global install from this checkout:

```bash
bun run install:global
```

If `coco` is not found:

```bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Commands

```bash
bun test
bun run check
bun run build
bun run test:page
```

## Docs

- [Tutorial](docs/tutorial.md)
- [Lexer Reference](docs/lexer.md)
- [Runtime](docs/runtime.md)
- [Examples](docs/examples.md)
- [Roadmap](docs/roadmap.md)
- [Design Influences](docs/design-influences.md)
- [Agent Guide](Agent.md)
- [LLM Project Map](llms.txt)

## Status

Implemented:

- Lexer 1.0
- REPL
- `coco lex`
- `coco runtime inspect/plan/dev --dry-run`
- Runtime manifest planning, event bus, scheduler, and plugin registry
- Tests, docs, examples, and a static docs page

Planned:

- Parser
- AST
- JavaScript emitter
- Real runtime adapters

## License

MIT
