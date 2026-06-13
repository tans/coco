# Coco Tutorial

This tutorial covers the syntax supported by the current MVP compiler.

## 1. Create a File

Create `hello.coco`:

```coco
const version = "0.1"

fn greet name
  print "Hello {name}"

greet "Coco"
```

## 2. Run It

```bash
bun run src/cli.ts run hello.coco
```

The command compiles Coco to JavaScript in a temporary file and executes it
with Bun.

## 3. Tokenize, Parse, or Compile It

```bash
bun run src/cli.ts lex hello.coco
bun run src/cli.ts parse hello.coco
bun run src/cli.ts compile hello.coco -o hello.js
```

`lex` prints a token stream, `parse` prints AST JSON, and `compile` emits
modern JavaScript. For example, `fn` is a `KEYWORD`, `greet` is an
`IDENTIFIER`, and the indented function body is wrapped by `INDENT` and
`DEDENT` before parsing.

After global installation, running `coco` starts the REPL:

```text
coco> const name = "Coco"
KEYWORD("const") IDENTIFIER("name") ASSIGN("=") STRING("\"Coco\"") NEWLINE("\n")
```

For multi-line indentation examples, use `.paste` and submit an empty line:

```text
coco> .paste
... if ok
...   print "yes"
...
KEYWORD("if") IDENTIFIER("ok") NEWLINE("\n") INDENT IDENTIFIER("print") STRING("\"yes\"") NEWLINE("\n") DEDENT
```

## 4. Variables and Constants

```coco
name = "Tom"
age = 18
active = true

const version = "1.0"
```

Variables compile to `let`; constants compile to `const`.

## 5. Strings

```coco
plain = "hello"
message = "Hello {name}"
```

Interpolated strings are emitted as JavaScript template literals for simple
expressions such as `{name}` and `{user.name}`.

## 6. Blocks

```coco
if age >= 18
  print "adult"
else
  print "child"
```

Indentation defines the block. The lexer emits `INDENT` after the `if` line
and `DEDENT` when the block ends.

## 7. Functions

```coco
fn add a b
  return a + b
```

The parser turns this into a `FunctionDeclaration` with `params` and `body`.
If the final statement in a function is an expression, it is emitted as an
implicit return.

## 8. Ranges, Pipelines, and Match

Inclusive ranges work inside `for in` and other expressions:

```coco
for i in 1..3
  print i
```

This emits a small local helper only when ranges are used.

Pipelines support simple function chaining:

```coco
result = 2 |> double |> add 3 |> print
```

This lowers to nested JavaScript calls. The currently supported forms are
`value |> fnName` and `value |> fnName arg`.

`match` currently supports statement form with an explicit wildcard branch:

```coco
match age
  20 -> print "twenty"
  _ -> print "other"
```

The compiler requires `_` as a fallback case and lowers the construct to a
scoped JavaScript IIFE.

## 9. Classes and Modules

Classes support `extends`, `init` as `constructor`, and explicit `new`:

```coco
class User extends Person
  fn init name
    @name = name

user = new User "Tom"
```

Imports and exports support:

```coco
import client, { request } from "client"
export { User }
export user
export default User
```

## 10. Current Limits

The compiler is still an MVP. It does not yet support exceptions, type
annotations, generics, decorators, source maps, or a type checker. `match`
does not yet exist as an expression, and pipeline support is intentionally
limited to call-style right-hand sides.

## 11. Next Steps

Read:

- `docs/lexer.md` for the token reference
- `docs/architecture.md` for compiler stages
- `docs/roadmap.md` for the MVP scope
