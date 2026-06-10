# Design Influences

Coco should learn from excellent languages without copying their surface
syntax wholesale. The goal is a modern language that is pleasant for humans,
predictable for tools, and easy for AI systems to generate, inspect, and fix.

## Python

What to learn:

- Indentation is a real part of the language, not style trivia.
- Readable code should be the default formatting outcome.
- Diagnostics should point at the exact line and column.
- A small tutorial can teach useful programming quickly.

What not to copy blindly:

- Runtime object model complexity.
- Significant whitespace edge cases that make generated code fragile.
- Large standard-library assumptions for a language targeting JavaScript.

Coco decision:

- Use indentation for blocks.
- Keep layout tokens explicit: `NEWLINE`, `INDENT`, `DEDENT`.
- Treat blank lines and comment-only lines as layout-neutral.

## Ruby

What to learn:

- Scripts can feel natural without excessive punctuation.
- Blocks and method calls can be expressive.
- Naming and readability matter more than symbolic cleverness.

What not to copy blindly:

- Too many implicit call forms.
- Highly dynamic behavior that makes static tooling difficult.
- Multiple equivalent ways to express the same construct in the MVP.

Coco decision:

- Allow concise calls such as `greet "Coco"`.
- Keep the parser conservative so tooling can reason about code.

## CoffeeScript

What to learn:

- JavaScript can be given a smaller, friendlier authoring syntax.
- Indentation and optional punctuation can reduce noise.
- String interpolation and function shorthand are valuable.

What not to copy blindly:

- Ambiguities that surprise readers or tools.
- Heavy reliance on implicit behavior.
- Features that age poorly as JavaScript evolves.

Coco decision:

- Compile toward modern ES2023 rather than hiding JavaScript.
- Keep syntax minimal and explicit enough for AST generation.

## Go

What to learn:

- Small feature sets are easier to implement, teach, and maintain.
- Tooling should be fast and standard.
- There should be one obvious project workflow.

What not to copy blindly:

- Go's exact type model or package system.
- Verbosity that conflicts with Coco's scripting goal.

Coco decision:

- Keep MVP syntax small.
- Prefer fast Bun commands and deterministic test fixtures.

## TypeScript and Babel

What to learn:

- AST compatibility matters.
- Editor tooling, source locations, and structured diagnostics are core product
  features.
- JavaScript ecosystem interop should be designed in from day one.

What not to copy blindly:

- TypeScript's full type-system surface.
- Babel plugin complexity before the core compiler is stable.

Coco decision:

- Shape AST design toward Babel-like nodes.
- Keep tokens and future AST nodes JSON-serializable.

## Bun and Modern ESM

What to learn:

- A language tool can be fast to run without a complex build chain.
- ESM should be the default.
- CLI scripts and tests should run directly.

Coco decision:

- Use Bun for tests, CLI execution, and builds.
- Target ES2023.

## AI-Native Language Design

AI systems change what matters in a language:

- Generated code should be easy to parse and repair.
- Syntax should avoid hidden context and excessive overloading.
- Errors should identify the smallest useful fix.
- Docs should include many small examples.
- Compiler output should be machine-readable.
- Project metadata should tell agents what exists and what is future work.

Coco decisions:

- Keep `llms.txt` as a project map for AI readers.
- Keep `Agent.md` as a collaboration guide.
- Make diagnostics structured.
- Prefer fewer constructs with strong tests over broad unverified syntax.
- Add examples as executable fixtures whenever possible.

## Resulting Coco Personality

Coco should feel:

- Lightweight, but not magical
- Concise, but not ambiguous
- Friendly to scripts, but compatible with serious tooling
- Modern JavaScript-oriented, but not a nostalgic preprocessor
- Easy for humans and AI agents to read, generate, test, and evolve
