# Coco Target

Coco is a modern Bun-native language that compiles indentation-based `.coco`
source to ES2023 JavaScript.

The project should learn from excellent languages, but it should not clone any
one of them. Coco's identity is: concise syntax, explicit compiler stages,
strong tooling, JSON-serializable compiler data, and AI-friendly diagnostics.

## Pipeline

```text
.coco
  -> Lexer
Token Stream
  -> Parser
AST
  -> Transform
JS AST
  -> Emit
ES2023
```

## Current Milestone: Coco Lexer 1.0

Lexer 1.0 is implemented in `src/lexer.ts`.

The lexer must:

- Normalize CRLF and CR line endings to LF.
- Ignore single-line and multi-line comments.
- Emit source locations for every token.
- Emit `NEWLINE`, `INDENT`, and `DEDENT` using Python-style indentation.
- Ignore blank lines and comment-only lines for layout.
- Suppress layout newlines while inside `()`, `[]`, and `{}`.
- Detect string templates as `STRING_TEMPLATE`.
- Throw structured `CocoSyntaxError` diagnostics for lexical errors.

## Token Types

```text
EOF

IDENTIFIER
KEYWORD

STRING
STRING_TEMPLATE
NUMBER

TRUE
FALSE
NULL

NEWLINE
INDENT
DEDENT

LPAREN
RPAREN

LBRACKET
RBRACKET

LBRACE
RBRACE

COMMA
COLON
DOT

ASSIGN

PLUS
MINUS
STAR
SLASH
MOD

EQ
NE

GT
GTE
LT
LTE

AND
OR
NOT

PIPE

ARROW

AT
QUESTION
```

## Keywords

```text
const

fn
async
await
return

if
elif
else

match

for
in

while

break
continue

class

try
catch
finally

import
export
default
```

`true`, `false`, and `null` are literal tokens, not generic keywords.

`and`, `or`, and `not` are word operators emitted as `AND`, `OR`, and `NOT`.
The symbolic forms `&&`, `||`, and `!` are also accepted by the lexer.

## Identifier

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

## Number

Integers:

```coco
123
```

Floats:

```coco
12.34
```

Scientific notation:

```coco
1.2e10
```

## String

Double quotes:

```coco
"name"
```

Single quotes:

```coco
'name'
```

Multi-line strings:

```coco
"""
hello
world
"""
```

Interpolation:

```coco
"hello {name}"
```

Lexer output:

```text
STRING_TEMPLATE
```

Parser output should later split templates into string parts and expressions.

## Comment

Single-line:

```coco
# comment
```

Multi-line:

```coco
###
comment
###
```

Comments are ignored.

## Indentation

Coco uses Python-style indentation.

Example:

```coco
if ok
  print "yes"

print "done"
```

Token outline:

```text
KEYWORD(if)
IDENTIFIER(ok)
NEWLINE
INDENT
IDENTIFIER(print)
STRING("yes")
NEWLINE
DEDENT
IDENTIFIER(print)
STRING("done")
NEWLINE
EOF
```

## Parser Target

The parser is planned but not implemented yet.

### Program

```ebnf
program
  = statement*
```

### Statement

```ebnf
statement
  = variable_decl
  | const_decl
  | function_decl
  | async_function_decl
  | class_decl
  | if_stmt
  | while_stmt
  | for_stmt
  | match_stmt
  | import_stmt
  | export_stmt
  | return_stmt
  | expression_stmt
```

### Variable

```ebnf
variable_decl
  = IDENTIFIER ASSIGN expression
```

### Const

```ebnf
const_decl
  = "const" IDENTIFIER ASSIGN expression
```

### Function

```ebnf
function_decl
  = "fn" IDENTIFIER parameter_list? block
```

Example:

```coco
fn add a b
  a + b
```

### Parameters

```ebnf
parameter_list
  = IDENTIFIER*
```

### Async Function

```ebnf
async_function_decl
  = "async" "fn" IDENTIFIER parameter_list? block
```

### Class

```ebnf
class_decl
  = "class" IDENTIFIER block
```

### Method

```ebnf
method_decl
  = "fn" IDENTIFIER parameter_list? block
```

### If

```ebnf
if_stmt
  = "if" expression block
    ("elif" expression block)*
    ("else" block)?
```

### While

```ebnf
while_stmt
  = "while" expression block
```

### For

```ebnf
for_stmt
  = "for" IDENTIFIER "in" expression block
```

### Match

`match` is reserved, but it is not part of the MVP compiler.

```ebnf
match_stmt
  = "match" expression INDENT match_case* DEDENT
```

### Block

```ebnf
block
  = NEWLINE INDENT statement* DEDENT
```

## Expression Target

### Primary

```ebnf
primary
  = NUMBER
  | STRING
  | STRING_TEMPLATE
  | TRUE
  | FALSE
  | NULL
  | IDENTIFIER
```

### Call

```ebnf
call_expr
  = expression argument_list
```

Supported call styles:

```coco
hello "tom"
add 1 2
hello("tom")
add(1, 2)
```

### Member Access

```ebnf
member_expr
  = expression DOT IDENTIFIER
```

### Optional Access

```ebnf
optional_expr
  = expression QUESTION DOT IDENTIFIER
```

Example:

```coco
user?.profile?.avatar
```

### Binary

```ebnf
binary_expr
  = expression operator expression
```

### Pipeline

The lexer emits `PIPE`. Parser design should reserve the operator for a clear,
low-ambiguity pipeline form.

## AST Target

The AST should be Babel-inspired and JSON-serializable.

### Program

```json
{
  "type": "Program",
  "body": []
}
```

### VariableDeclaration

```json
{
  "type": "VariableDeclaration",
  "kind": "let",
  "name": "user",
  "value": {}
}
```

### FunctionDeclaration

```json
{
  "type": "FunctionDeclaration",
  "name": "add",
  "params": ["a", "b"],
  "body": []
}
```

### ClassDeclaration

```json
{
  "type": "ClassDeclaration",
  "name": "User",
  "body": []
}
```

### MethodDeclaration

```json
{
  "type": "MethodDeclaration",
  "name": "hello",
  "params": [],
  "body": []
}
```

### IfStatement

```json
{
  "type": "IfStatement",
  "test": {},
  "consequent": [],
  "alternate": []
}
```

### ForStatement

```json
{
  "type": "ForStatement",
  "iterator": "user",
  "source": {},
  "body": []
}
```

### CallExpression

```json
{
  "type": "CallExpression",
  "callee": {},
  "arguments": []
}
```

### MemberExpression

```json
{
  "type": "MemberExpression",
  "object": {},
  "property": {},
  "optional": false
}
```

### BinaryExpression

```json
{
  "type": "BinaryExpression",
  "operator": "+",
  "left": {},
  "right": {}
}
```

## Recommended MVP Compiler Scope

Implement:

```text
let-style variable declarations
const
fn
return
if / elif / else
for in
class
import / export
async / await
string interpolation
optional chaining
pipeline
```

Do not implement in the first compiler:

```text
match
generics
JSX
macro system
decorators
type checker
```

## Language Influences

Coco should learn from:

- Python: indentation, clear reading order, location-rich diagnostics.
- Ruby: expressive scripts and pleasant blocks.
- CoffeeScript: concise JavaScript-oriented authoring, while avoiding hidden
  magic and ambiguous historical shortcuts.
- Go: small feature set, fast commands, strong tooling discipline.
- TypeScript: AST literacy, editor compatibility, JavaScript ecosystem fit.
- Bun: modern ESM and fast local feedback.

AI-era additions:

- Syntax should be easy for agents to generate and repair.
- Compiler data should serialize cleanly.
- Diagnostics should give exact positions and small fixes.
- Docs should include many runnable examples.
- Project metadata such as `llms.txt` and `Agent.md` should guide future tools.

See `docs/design-influences.md` for the full rationale.

## Engineering Acceptance Criteria

A target milestone is complete only when:

- Code exists.
- Tests cover the behavior.
- CLI or public API access exists where appropriate.
- Docs and examples match the behavior.
- `README.md`, `llms.txt`, and `Agent.md` describe the status honestly.
- `bun test`, `bun run check`, and `bun run build` pass.
