import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { CocoSyntaxError, tokenize, type TokenType } from "../src";

function types(source: string): TokenType[] {
  return tokenize(source).map((token) => token.type);
}

function lexemes(source: string): string[] {
  return tokenize(source)
    .filter((token) => token.type !== "EOF")
    .map((token) => token.lexeme);
}

describe("Coco Lexer 1.0", () => {
  test("tokenizes identifiers, keywords, literals, and assignment", () => {
    const tokens = tokenize('const name = "Tom"\nactive = true\nnothing = null\n');

    expect(tokens.map((token) => token.type)).toEqual([
      "KEYWORD",
      "IDENTIFIER",
      "ASSIGN",
      "STRING",
      "NEWLINE",
      "IDENTIFIER",
      "ASSIGN",
      "TRUE",
      "NEWLINE",
      "IDENTIFIER",
      "ASSIGN",
      "NULL",
      "NEWLINE",
      "EOF",
    ]);
    expect(tokens[3]?.value).toBe("Tom");
    expect(tokens[7]?.value).toBe(true);
    expect(tokens[11]?.value).toBe(null);
  });

  test("supports integer, float, and scientific numbers", () => {
    const tokens = tokenize("a = 123\nb = 12.34\nc = 1.2e10\n");
    const numbers = tokens.filter((token) => token.type === "NUMBER").map((token) => token.value);

    expect(numbers).toEqual([123, 12.34, 1.2e10]);
  });

  test("tracks source locations", () => {
    const token = tokenize("first = 1\n  second = 2\n").find((item) => item.lexeme === "second");

    expect(token?.start).toEqual({ line: 2, column: 3, index: 12 });
    expect(token?.end).toEqual({ line: 2, column: 9, index: 18 });
  });

  test("emits indentation tokens with Python-style layout", () => {
    expect(types('if ok\n  print "yes"\n\nprint "done"\n')).toEqual([
      "KEYWORD",
      "IDENTIFIER",
      "NEWLINE",
      "INDENT",
      "IDENTIFIER",
      "STRING",
      "NEWLINE",
      "DEDENT",
      "IDENTIFIER",
      "STRING",
      "NEWLINE",
      "EOF",
    ]);
  });

  test("handles nested indentation", () => {
    expect(types("if ok\n  if nested\n    value = 1\n  other = 2\n")).toEqual([
      "KEYWORD",
      "IDENTIFIER",
      "NEWLINE",
      "INDENT",
      "KEYWORD",
      "IDENTIFIER",
      "NEWLINE",
      "INDENT",
      "IDENTIFIER",
      "ASSIGN",
      "NUMBER",
      "NEWLINE",
      "DEDENT",
      "IDENTIFIER",
      "ASSIGN",
      "NUMBER",
      "NEWLINE",
      "DEDENT",
      "EOF",
    ]);
  });

  test("emits multiple DEDENT tokens when closing nested blocks", () => {
    expect(types("if a\n  if b\n    c = 1\nd = 2\n")).toEqual([
      "KEYWORD",
      "IDENTIFIER",
      "NEWLINE",
      "INDENT",
      "KEYWORD",
      "IDENTIFIER",
      "NEWLINE",
      "INDENT",
      "IDENTIFIER",
      "ASSIGN",
      "NUMBER",
      "NEWLINE",
      "DEDENT",
      "DEDENT",
      "IDENTIFIER",
      "ASSIGN",
      "NUMBER",
      "NEWLINE",
      "EOF",
    ]);
  });

  test("uses eight-column tab stops for indentation", () => {
    expect(types("if ok\n\tvalue = 1\n")).toEqual([
      "KEYWORD",
      "IDENTIFIER",
      "NEWLINE",
      "INDENT",
      "IDENTIFIER",
      "ASSIGN",
      "NUMBER",
      "NEWLINE",
      "DEDENT",
      "EOF",
    ]);
  });

  test("ignores single-line and multi-line comments", () => {
    expect(lexemes("a = 1 # inline\n###\nignored\n###\nb = 2\n")).toEqual([
      "a",
      "=",
      "1",
      "\n",
      "b",
      "=",
      "2",
      "\n",
    ]);
  });

  test("marks interpolated strings as STRING_TEMPLATE", () => {
    const tokens = tokenize('print "Hello {name}"\nmessage = """hello\n{name}\n"""\n');
    expect(tokens.filter((token) => token.type === "STRING_TEMPLATE")).toHaveLength(2);
  });

  test("recognizes operators and punctuation", () => {
    expect(types("a == b && c != d || e >= 1 => f?.g 1..3 |> print 1 -> one\n")).toEqual([
      "IDENTIFIER",
      "EQ",
      "IDENTIFIER",
      "AND",
      "IDENTIFIER",
      "NE",
      "IDENTIFIER",
      "OR",
      "IDENTIFIER",
      "GTE",
      "NUMBER",
      "ARROW",
      "IDENTIFIER",
      "QUESTION",
      "DOT",
      "IDENTIFIER",
      "NUMBER",
      "RANGE",
      "NUMBER",
      "PIPE",
      "IDENTIFIER",
      "NUMBER",
      "ARROW",
      "IDENTIFIER",
      "NEWLINE",
      "EOF",
    ]);
  });

  test("recognizes word operators", () => {
    expect(types("not active or ready and ok\n")).toEqual([
      "NOT",
      "IDENTIFIER",
      "OR",
      "IDENTIFIER",
      "AND",
      "IDENTIFIER",
      "NEWLINE",
      "EOF",
    ]);
  });

  test("suppresses newlines inside brackets", () => {
    expect(types("users = [\n  \"Tom\"\n  \"Jerry\"\n]\n")).toEqual([
      "IDENTIFIER",
      "ASSIGN",
      "LBRACKET",
      "STRING",
      "STRING",
      "RBRACKET",
      "NEWLINE",
      "EOF",
    ]);
  });

  test("throws on inconsistent indentation", () => {
    expect(() => tokenize("if ok\n  one = 1\n bad = 2\n")).toThrow(CocoSyntaxError);
  });

  test("throws on unterminated strings and comments", () => {
    expect(() => tokenize('"open\n')).toThrow(CocoSyntaxError);
    expect(() => tokenize("###\nopen\n")).toThrow(CocoSyntaxError);
  });

  test("throws on unexpected characters", () => {
    expect(() => tokenize("price = $10\n")).toThrow(CocoSyntaxError);
  });

  test("tokenizes all valid examples", async () => {
    const examplesDir = join(import.meta.dir, "..", "examples");
    const files = (await readdir(examplesDir))
      .filter((file) => file.endsWith(".coco"))
      .filter((file) => !file.includes("diagnostics-bad"));

    for (const file of files) {
      const source = await Bun.file(join(examplesDir, file)).text();
      expect(tokenize(source).at(-1)?.type, file).toBe("EOF");
    }
  });
});
