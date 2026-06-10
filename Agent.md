# Agent Guide

This file is for AI coding agents working on Coco.

## Mission

Build Coco as a small, well-documented Bun-native language project. The current
stable implementation target is **Lexer 1.0**. Future compiler stages should be
added only when they are implemented, tested, and documented.

## Current Architecture

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

Implemented:

- `src/token.ts`
- `src/lexer.ts`
- `src/index.ts`
- `src/cli.ts`
- `tests/lexer.test.ts`
- `src/runtime/*`
- `tests/runtime.test.ts`
- `tests/runtime-cli.test.ts`

## Working Rules

- Use Bun and TypeScript.
- Keep the project ESM-first.
- Keep compiler stages separate.
- Keep language core and runtime modules separate.
- Do not import runtime modules from `src/index.ts`, `src/lexer.ts`, or
  `src/token.ts`.
- Keep package exports split: `.` for language core, `./runtime` for runtime.
- Load runtime code only from CLI runtime commands or runtime-specific modules.
- Do not put parser behavior into the lexer.
- Preserve `line`, `column`, and `index` on tokens and diagnostics.
- Add tests for every syntax, token, or diagnostic change.
- Update `README.md`, `docs/`, examples, and `llms.txt` when public behavior
  changes.
- Keep examples honest: only mark behavior as implemented when tests prove it.

## Language Design Principles

Coco should learn from good languages without becoming a clone.

- From Python: indentation blocks, approachable reading order, clear errors.
- From Ruby: expressive blocks, pleasant scripting, low ceremony.
- From CoffeeScript: concise JavaScript-oriented syntax, but avoid ambiguous
  historical shortcuts.
- From Go: small feature set, strong tooling discipline, fast commands.
- From TypeScript: ecosystem compatibility, AST literacy, editor friendliness.
- From Bun: modern ESM defaults, direct script execution, fast feedback loops.

AI-era additions:

- Syntax should be easy for models to generate and repair.
- Diagnostics should point to exact locations and likely causes.
- Docs should contain runnable examples and command outputs where practical.
- Compiler data structures should serialize cleanly for tools and agents.
- Ambiguous grammar should be rejected early instead of guessed.

## Commands

```bash
bun test
COCO_PAGE_URL=http://127.0.0.1:4173 bun run test:page
bun run check
bun run build
bun run install:global
printf '.exit\n' | coco
bun run src/cli.ts lex examples/hello.coco
bun run src/cli.ts runtime plan examples/runtime/agent-web.json
```

## Before Marking Work Complete

Verify:

- Tests pass.
- Type-check passes.
- Build passes.
- Docs match actual implementation.
- Examples tokenize successfully, except intentionally invalid diagnostics
  fixtures.
- Runtime examples produce plans and dry-run output.
- `target.md` and `lang-spec.md` remain consistent with the implemented stage
  or clearly label future work.

## Common Next Tasks

1. Add parser fixtures for variable declarations and expressions.
2. Define Babel-like AST types for the MVP syntax.
3. Add `cococ parse` before adding `cococ compile`.
4. Add emitter snapshots only after parser snapshots are stable.
