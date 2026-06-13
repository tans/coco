# Diagnostics

Lexer and parser diagnostics throw `CocoSyntaxError`.

The error contains:

- `message`
- `line`
- `column`
- `index`

The CLI prints diagnostics as:

```text
file.coco:line:column: message
```

## Current Errors

Inconsistent indentation:

```coco
if ok
  one = 1
 bad = 2
```

Unterminated string:

```coco
"hello
```

Unterminated multi-line comment:

```coco
###
comment
```

Unexpected character:

```coco
price = $10
```

Parser errors:

```coco
fn add a b
return a + b
```

The function body is missing its required indentation block.

Unsupported or incomplete forms are also diagnosed clearly. Example:

```coco
match value
  1 -> "one"
```

This currently reports that a wildcard `_` case is required.

## Design Rule

Lexer diagnostics should only report lexical problems. Grammar errors are
reported by the parser with the same `CocoSyntaxError` shape.
