import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "../src";

describe("Coco parser", () => {
  test("parses functions, calls, and conditions", () => {
    const ast = parse(readExample("examples/hello.coco"));

    expect(ast.kind).toBe("Program");
    expect(ast.body.map((statement) => statement.kind)).toEqual([
      "VariableDeclaration",
      "FunctionDeclaration",
      "IfStatement",
    ]);
  });

  test("parses arrays, indentation objects, and optional chaining", () => {
    const ast = parse(readExample("examples/collections.coco"));
    const profile = ast.body[1];
    const avatar = ast.body[2];

    expect(profile?.kind).toBe("VariableDeclaration");
    if (profile?.kind === "VariableDeclaration") {
      expect(profile.value.kind).toBe("ObjectExpression");
    }

    expect(avatar?.kind).toBe("VariableDeclaration");
    if (avatar?.kind === "VariableDeclaration") {
      expect(avatar.value.kind).toBe("MemberExpression");
    }
  });

  test("parses imports, exports, classes, and methods", () => {
    const ast = parse(readExample("examples/modules-and-class.coco"));

    expect(ast.body.map((statement) => statement.kind)).toEqual([
      "ImportDeclaration",
      "ClassDeclaration",
      "ExportDeclaration",
      "VariableDeclaration",
      "ExportDeclaration",
      "ExportDeclaration",
    ]);
  });

  test("parses ranges, match statements, pipelines, and constructors", () => {
    const ast = parse(`for i in 1..3
  print i

result = 1 |> double |> add 2
user = new User "Tom"

match result
  1 -> "one"
  _ -> "other"
`);

    expect(ast.body.map((statement) => statement.kind)).toEqual([
      "ForInStatement",
      "VariableDeclaration",
      "VariableDeclaration",
      "MatchStatement",
    ]);

    const loop = ast.body[0];
    expect(loop?.kind).toBe("ForInStatement");
    if (loop?.kind === "ForInStatement") {
      expect(loop.iterable.kind).toBe("RangeExpression");
    }

    const result = ast.body[1];
    expect(result?.kind).toBe("VariableDeclaration");
    if (result?.kind === "VariableDeclaration") {
      expect(result.value.kind).toBe("PipelineExpression");
    }
  });

  test("requires a wildcard match case", () => {
    expect(() =>
      parse(`match value
  1 -> "one"
`),
    ).toThrow("Expected wildcard _ match case");
  });
});

function readExample(path: string): string {
  return readFileSync(join(import.meta.dir, "..", path), "utf8");
}
