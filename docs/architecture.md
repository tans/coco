# Architecture

Coco is organized as a staged compiler pipeline:

```text
.coco source
  -> Lexer
Token Stream
  -> Parser
Coco AST
  -> Transform
JavaScript AST
  -> Emit
ES2023
```

## Current Milestone

The repository currently implements a working MVP pipeline through JavaScript
emit.

The lexer is responsible for:

- Normalizing line endings
- Ignoring comments
- Emitting literal, identifier, keyword, operator, and punctuation tokens
- Emitting Python-style `INDENT` and `DEDENT` layout tokens
- Tracking line, column, and character index for every token

The parser is responsible for:

- Validating MVP grammar
- Building typed AST nodes
- Handling indentation-defined statement blocks
- Handling whitespace-style calls such as `print "hi"`
- Parsing ranges, pipelines, match statements, class inheritance, and explicit
  `new`

The emitter is responsible for:

- Emitting modern JavaScript for Bun/ES2023
- Lowering `print` calls to `console.log`
- Emitting braces from indentation blocks
- Converting simple string interpolation to template literals
- Lowering inclusive ranges through a local helper only when needed
- Lowering `match` statements to scoped JavaScript control flow

The compiler is not responsible for:

- Resolving names
- Performing type checks
- Producing source maps yet

## Module Boundaries

`src/token.ts`
: Token types, token shape, keyword table, and `CocoSyntaxError`.

`src/lexer.ts`
: The scanner and indentation engine.

`src/ast.ts`
: Typed AST node definitions.

`src/parser.ts`
: Recursive descent parser for MVP Coco syntax.

`src/emitter.ts`
: JavaScript emitter and `compile` API.

`src/index.ts`
: Public API exports.

`src/cli.ts`
: Thin command-line wrapper for the public API.

## Error Model

Lexical and parser errors throw `CocoSyntaxError` with `line`, `column`, and
`index` properties. The CLI formats these diagnostics with the input filename.

## Runtime Separation

Coco's language implementation and runtime implementation are intentionally
separated.

```text
Language core:
  src/token.ts
  src/lexer.ts
  src/index.ts

Optional runtime:
  src/runtime/*
```

The language core does not import runtime modules. The CLI uses dynamic import
only for `coco runtime ...` commands. This keeps runtime dependencies optional
and allows a future package split:

```text
@coco/lang
@coco/runtime
@coco/cli
@coco/plugin-openai
@coco/plugin-redis
```

See `docs/runtime.md` for the current runtime base.
