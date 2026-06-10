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

The repository currently implements the first stage, **Lexer 1.0**.

The lexer is responsible for:

- Normalizing line endings
- Ignoring comments
- Emitting literal, identifier, keyword, operator, and punctuation tokens
- Emitting Python-style `INDENT` and `DEDENT` layout tokens
- Tracking line, column, and character index for every token

The lexer is not responsible for:

- Validating grammar
- Building AST nodes
- Resolving names
- Emitting JavaScript
- Performing type checks

## Module Boundaries

`src/token.ts`
: Token types, token shape, keyword table, and `CocoSyntaxError`.

`src/lexer.ts`
: The scanner and indentation engine.

`src/index.ts`
: Public API exports.

`src/cli.ts`
: Thin command-line wrapper for the public API.

## Error Model

Lexical errors throw `CocoSyntaxError` with `line`, `column`, and `index`
properties. The CLI formats these diagnostics with the input filename.

## Future Stages

The parser should consume only tokens. It should not rescan source text.

The AST should follow Babel-style shapes where practical, while staying small
enough for Coco-specific syntax.

The emitter should target ES2023 and preserve simple output where possible.

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
