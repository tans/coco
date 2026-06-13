import { describe, expect, test } from "bun:test";
import { compile } from "../src";

describe("Coco JavaScript emitter", () => {
  test("compiles variables, functions, interpolation, and if/else", () => {
    const js = compile(`const version = "0.1"

fn greet name
  print "Hello {name}"

if version == "0.1"
  greet "Coco"
else
  print "Unknown"
`);

    expect(js).toContain('const version = "0.1";');
    expect(js).toContain("function greet(name)");
    expect(js).toContain("console.log(`Hello ${name}`)");
    expect(js).toContain('if (version === "0.1")');
  });

  test("compiles collections and optional chaining", () => {
    const js = compile(`users = [
  "Tom"
  "Jerry"
]

profile =
  name: "Tom"
  contact:
    email: "tom@example.com"

avatar = profile?.contact?.avatar
`);

    expect(js).toContain('let users = ["Tom", "Jerry"];');
    expect(js).toContain('let profile = { name: "Tom", contact: { email: "tom@example.com" } };');
    expect(js).toContain("let avatar = profile?.contact?.avatar;");
  });

  test("compiles async functions, await, and arrows", () => {
    const js = compile(`async fn loadUser id
  user = await fetchUser id
  return user

double = (x) => x * 2
`);

    expect(js).toContain("async function loadUser(id)");
    expect(js).toContain("let user = await fetchUser(id);");
    expect(js).toContain("let double = (x) => x * 2;");
  });

  test("compiles inclusive ranges and for loops", () => {
    const js = compile(`for i in 1..3
  print i
`);

    expect(js).toContain("function __cocoRange(start, end)");
    expect(js).toContain("for (const i of __cocoRange(1, 3))");
    expect(js).toContain("console.log(i);");
  });

  test("compiles pipeline expressions as nested calls", () => {
    const js = compile(`result = 2 |> double |> add 3 |> print
`);

    expect(js).toContain("let result = console.log(add(double(2), 3));");
  });

  test("compiles match statements to scoped conditional expressions", () => {
    const js = compile(`label = matchValue

match label
  "one" -> print "one"
  _ -> print "other"
`);

    expect(js).toContain("(() => {");
    expect(js).toContain('if (__cocoMatch3_1 === "one")');
    expect(js).toContain('console.log("one");');
    expect(js).toContain('console.log("other");');
  });

  test("compiles class inheritance, init, new, and import/export lists", () => {
    const js = compile(`import client, { request } from "http"

class User extends Person
  fn init name
    @name = name

user = new User "Tom"
export { User }
export user
`);

    expect(js).toContain('import client, { request } from "http";');
    expect(js).toContain("class User extends Person");
    expect(js).toContain("constructor(name)");
    expect(js).toContain('let user = new User("Tom");');
    expect(js).toContain("export { User };");
    expect(js).toContain("export { user };");
  });
});
