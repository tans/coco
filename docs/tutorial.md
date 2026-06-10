# Coco Tutorial

This tutorial covers the syntax already represented by the current lexer and
the syntax planned for the first parser milestone.

## 1. Create a File

Create `hello.coco`:

```coco
const version = "0.1"

fn greet name
  print "Hello {name}"

greet "Coco"
```

## 2. Tokenize It

```bash
bun run src/cli.ts lex hello.coco
```

The command prints a token stream. For example, `fn` is a `KEYWORD`, `greet`
is an `IDENTIFIER`, and the indented function body is wrapped by `INDENT` and
`DEDENT`.

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

## 3. Variables and Constants

```coco
name = "Tom"
age = 18
active = true

const version = "1.0"
```

Variables are planned to compile to `let`; constants compile to `const`.

## 4. Strings

```coco
plain = "hello"
message = "Hello {name}"
```

Interpolated strings are emitted as `STRING_TEMPLATE` tokens. Parser support
will lower them to JavaScript template literals.

## 5. Blocks

```coco
if age >= 18
  print "adult"
else
  print "child"
```

Indentation defines the block. The lexer emits `INDENT` after the `if` line
and `DEDENT` when the block ends.

## 6. Functions

```coco
fn add a b
  return a + b
```

The planned parser will turn this into a `FunctionDeclaration` with `params`
and `body`.

## 7. Next Steps

Read:

- `docs/lexer.md` for the token reference
- `docs/architecture.md` for compiler stages
- `docs/roadmap.md` for the MVP scope
