# Roadmap

## Done

- Bun + TypeScript project scaffold
- Coco Lexer 1.0
- CLI command for lexing `.coco` files
- Tests for literals, comments, indentation, strings, and operators
- Docs, tutorial, example, and static project page

## MVP Compiler Scope

The first full compiler should implement:

- Variables and constants
- Functions and explicit `return`
- `if`, `elif`, and `else`
- `for in`
- Classes and methods
- `import` and `export`
- `async` and `await`
- String interpolation
- Optional chaining
- Pipeline operator

## Non-Goals for MVP

- `match`
- Generics
- JSX
- Macro system
- Decorators
- Type checker

## Suggested Stage Order

1. Parser for expressions and simple statements
2. Parser for blocks, functions, and conditions
3. AST normalization and fixture snapshots
4. JavaScript emitter for MVP syntax
5. CLI `compile` command
6. Source maps and formatter-friendly output
