# Diagnostics

Lexer diagnostics throw `CocoSyntaxError`.

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

## Design Rule

Lexer diagnostics should only report lexical problems. Grammar errors belong
to the parser stage.
