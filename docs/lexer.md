# Coco Lexer 1.0

The lexer converts `.coco` source into a token stream.

## Token Types

```text
EOF
IDENTIFIER KEYWORD
STRING STRING_TEMPLATE NUMBER
TRUE FALSE NULL
NEWLINE INDENT DEDENT
LPAREN RPAREN LBRACKET RBRACKET LBRACE RBRACE
COMMA COLON DOT ASSIGN
PLUS MINUS STAR SLASH MOD
EQ NE GT GTE LT LTE
AND OR NOT PIPE ARROW
AT QUESTION
```

## Keywords

```text
const fn async await return
if elif else match
for in while break continue
class try catch finally
import export default
```

`true`, `false`, and `null` are emitted as `TRUE`, `FALSE`, and `NULL`
literal tokens instead of generic keywords.

## Identifiers

```regex
[a-zA-Z_][a-zA-Z0-9_]*
```

Examples:

```coco
user
user_name
User
UserService
```

## Numbers

```coco
123
12.34
1.2e10
```

The token `value` is a JavaScript number.

## Strings

```coco
"name"
'name'
"""
hello
world
"""
```

Strings containing `{` and `}` are emitted as `STRING_TEMPLATE`. Template
contents are intentionally left for the parser to split.

```coco
"hello {name}"
```

## Comments

Single-line comments start with `#`.

```coco
# comment
```

Multi-line comments use `###`.

```coco
###
comment
###
```

Comments are ignored and never emitted as tokens.

## Indentation

Coco uses Python-style indentation. A larger leading indentation emits
`INDENT`; returning to a previous indentation emits one or more `DEDENT`
tokens.

```coco
if ok
  print "yes"

print "done"
```

Token outline:

```text
KEYWORD IDENTIFIER NEWLINE
INDENT IDENTIFIER STRING NEWLINE
DEDENT IDENTIFIER STRING NEWLINE
EOF
```

Blank lines and comment-only lines do not affect indentation.

## CLI

```bash
bun run src/cli.ts lex examples/hello.coco
coco lex examples/hello.coco
```

The CLI prints JSON tokens with `type`, `lexeme`, `value`, `start`, and `end`.

Running `coco` without a subcommand starts the REPL. It tokenizes each submitted
line, and `.paste` enables multi-line input for indented blocks.
