# Examples

Run any example through the lexer:

```bash
bun run src/cli.ts lex examples/hello.coco
```

## Hello

File: `examples/hello.coco`

```coco
const version = "0.1"

fn greet name
  print "Hello {name}"

if version == "0.1"
  greet "Coco"
else
  print "Unknown version"
```

## Control Flow

File: `examples/control-flow.coco`

Shows `if`, `elif`, `else`, `for in`, `while`, word operators, and `break`.

## Collections

File: `examples/collections.coco`

Shows array layout, object-like indentation, nested fields, and optional
chaining.

## Functions

File: `examples/functions.coco`

Shows normal functions, async functions, `await`, explicit return, and arrow
function syntax.

## Modules and Class

File: `examples/modules-and-class.coco`

Shows import/export keywords, class declarations, methods, and string
interpolation in paths.

## Diagnostics

File: `examples/diagnostics-bad-indent.coco`

This file intentionally has inconsistent indentation. It is useful for checking
error formatting:

```bash
bun run src/cli.ts lex examples/diagnostics-bad-indent.coco
```

## Runtime Manifests

Runtime examples live in `examples/runtime/`.

```bash
coco runtime plan examples/runtime/agent-web.json
coco runtime dev examples/runtime/agent-web.json --dry-run
coco runtime plan examples/runtime/game-desktop.json
```
