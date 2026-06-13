# Roadmap

## Done

- Bun + TypeScript project scaffold
- Coco Lexer 1.0
- CLI command for lexing `.coco` files
- Typed AST definitions
- Recursive descent parser for MVP syntax
- JavaScript emitter targeting modern Bun/ES2023
- CLI commands for `parse`, `compile`, and `run`
- Tests for lexer, parser, emitter, compiler CLI, and runtime CLI behavior
- Docs, tutorial, example, and static project page

## MVP Compiler Scope Implemented

The current compiler implements:

- Variables, constants, and assignment
- Expressions with precedence, unary operators, binary operators, and logical
  operators
- Numbers, strings, simple string interpolation, booleans, and null
- Arrays and indentation object literals
- Property access and optional chaining
- Functions, explicit `return`, and implicit return for final function
  expression statements
- Calls with parentheses and whitespace call syntax
- `if`, `elif`, and `else`
- `for in`
- Inclusive ranges with `..`
- `while`, `break`, and `continue`
- `async` and `await`
- Pipeline expressions for simple call chains
- `match` statements with wildcard fallback
- Basic `import` and `export`, including default+named imports and named exports
- Classes, methods, `extends`, and explicit `new`

## Partial or Future Features

- Exceptions
- Generics
- JSX
- Macro system
- Decorators
- Type annotations and type checking
- Full class semantics beyond `extends`, `init`, and explicit `new`
- Bare construction sugar such as `User "Tom"` becoming `new User("Tom")`
- Source maps

## Runtime Scope

The runtime planning layer remains separate from the language compiler. Runtime
manifest parsing, planning, dry-run events, scheduler, and plugin registry are
implemented; real runtime adapters remain future work.

## Next Compiler Stages

1. Source maps and formatter-friendly output
2. `match` expressions and broader pattern support
3. Broader class semantics
4. Type annotations and TypeScript-oriented emit
5. Real runtime adapters
