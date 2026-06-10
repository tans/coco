# Coco Language Specification 1.0

## Design Goals

Coco is a modern scripting language designed for Bun.

Principles:

* Indentation defines blocks
* No semicolons
* Parentheses optional
* Explicit over magic
* TypeScript compatible
* Compile to modern JavaScript
* Minimal syntax

File extension:

```text
.coco
```

---

# Comments

Single line:

```coco
# comment
```

Multi-line:

```coco
###
multi line
comment
###
```

---

# Variables

```coco
name = "Tom"

age = 18

active = true
```

Compiles to:

```js
let name = "Tom"
let age = 18
let active = true
```

---

# Constants

```coco
const version = "1.0"
```

Compiles to:

```js
const version = "1.0"
```

---

# String Interpolation

```coco
name = "Tom"

print "Hello {name}"
```

Compiles to:

```js
console.log(`Hello ${name}`)
```

---

# Primitive Types

```coco
name = "Tom"

age = 18

price = 19.99

active = true

nothing = null
```

---

# Arrays

```coco
users = [
  "Tom"
  "Jerry"
  "Lucy"
]
```

Equivalent:

```js
[
  "Tom",
  "Jerry",
  "Lucy"
]
```

---

# Objects

```coco
user =
  name: "Tom"
  age: 18
```

Equivalent:

```js
{
  name: "Tom",
  age: 18
}
```

---

# Property Access

```coco
user.name
```

Optional chaining:

```coco
user?.profile?.avatar
```

---

# Functions

```coco
fn hello name
  print "Hello {name}"
```

Equivalent:

```js
function hello(name) {
  console.log(`Hello ${name}`)
}
```

---

# Multiple Parameters

```coco
fn add a b
  a + b
```

Last expression is returned.

Equivalent:

```js
function add(a, b) {
  return a + b
}
```

---

# Explicit Return

```coco
fn add a b
  return a + b
```

---

# Function Calls

```coco
hello "Tom"

add 1 2
```

Also valid:

```coco
hello("Tom")

add(1, 2)
```

---

# Arrow Functions

```coco
double = (x) => x * 2
```

Block form:

```coco
double = (x) =>

  x * 2
```

---

# Conditions

```coco
if age >= 18
  print "adult"
```

---

# If Else

```coco
if age >= 18
  print "adult"
else
  print "child"
```

---

# Else If

```coco
if score >= 90
  grade = "A"

elif score >= 80
  grade = "B"

else
  grade = "C"
```

---

# Match

```coco
match role

  "admin"
    print "admin"

  "user"
    print "user"

  _
    print "guest"
```

Equivalent to switch.

---

# For Loop

```coco
for user in users
  print user
```

---

# Range

```coco
for i in 1..10
  print i
```

Inclusive range.

---

# While

```coco
while running
  tick()
```

---

# Break

```coco
while true

  if done
    break
```

---

# Continue

```coco
for item in items

  if invalid item
    continue

  process item
```

---

# Classes

```coco
class User

  fn init name
    @name = name

  fn hello
    print "Hello {@name}"
```

Equivalent:

```js
class User {

  constructor(name) {
    this.name = name
  }

  hello() {
    console.log(`Hello ${this.name}`)
  }

}
```

---

# Instance Creation

```coco
user = User "Tom"
```

Equivalent:

```js
const user = new User("Tom")
```

---

# This Shortcut

```coco
@name
```

Equivalent:

```js
this.name
```

---

# Async Functions

```coco
async fn loadUser id

  res = await fetch "/api/users/{id}"

  await res.json()
```

---

# Await

```coco
user = await loadUser 1
```

---

# Exceptions

```coco
try

  run()

catch err

  print err

finally

  cleanup()
```

---

# Imports

```coco
import fs from "fs"
```

Named:

```coco
import {
  readFile
  writeFile
} from "fs/promises"
```

---

# Exports

```coco
export fn hello
  print "hello"
```

---

# Default Export

```coco
export default User
```

---

# Type Annotations

Optional.

```coco
name: string = "Tom"

age: number = 18
```

---

# Function Types

```coco
fn add a:number b:number -> number

  a + b
```

Equivalent:

```ts
function add(
  a:number,
  b:number
):number
```

---

# Union Types

```coco
status: string | null
```

---

# Generic Types

```coco
users: Array<User>
```

---

# Pipeline Operator

```coco
users
  |> filter active
  |> sort age
  |> take 10
```

Equivalent:

```js
take(
  sort(
    filter(users, active),
    age
  ),
  10
)
```

---

# Null Coalescing

```coco
name = username ?? "Guest"
```

---

# Optional Chaining

```coco
user?.profile?.avatar
```

---

# Built-in Functions

```coco
print value
```

Equivalent:

```js
console.log(value)
```

Length:

```coco
len users
```

Equivalent:

```js
users.length
```

---

# Module System

ES Modules only.

```coco
import

export

export default
```

No CommonJS support.

---

# Standard Formatting Rules

* 2-space indentation
* UTF-8 encoding
* Unix line endings
* No semicolons
* No mandatory parentheses

---

# Compiler Target

Default:

```text
ES2023
```

Runtime:

```text
Bun
Node.js
Browser
Deno
```

---

# Example

```coco
import { readFile } from "fs/promises"

async fn main

  text = await readFile "hello.txt"

  print text

main()
```

Compiled JavaScript:

```js
import { readFile } from "fs/promises"

async function main() {

  const text = await readFile("hello.txt")

  console.log(text)

}

main()
```
