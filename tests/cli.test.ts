import { describe, expect, test } from "bun:test";

const cli = ["bun", "run", "src/cli.ts"];

async function runCli(args: string[], stdin = "") {
  const proc = Bun.spawn([...cli, ...args], {
    cwd: import.meta.dir + "/..",
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (stdin) {
    proc.stdin.write(stdin);
  }
  proc.stdin.end();

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout, stderr, exitCode };
}

describe("Coco CLI", () => {
  test("prints help", async () => {
    const result = await runCli(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("coco                    Start the Coco REPL");
    expect(result.stdout).toContain("coco lex <file.coco>");
  });

  test("lexes a file as JSON", async () => {
    const result = await runCli(["lex", "examples/hello.coco"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"type": "KEYWORD"');
    expect(result.stdout).toContain('"lexeme": "const"');
  });

  test("starts a compact token REPL when no command is provided", async () => {
    const result = await runCli([], 'const name = "Coco"\n.exit\n');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Coco REPL");
    expect(result.stdout).toContain('KEYWORD("const")');
    expect(result.stdout).toContain('STRING("\\"Coco\\"")');
  });

  test("toggles JSON tokens in the REPL", async () => {
    const result = await runCli([], '.tokens\nname = "Coco"\n.exit\n');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("token output: json");
    expect(result.stdout).toContain('"type": "IDENTIFIER"');
    expect(result.stdout).toContain('"value": "Coco"');
  });

  test("supports paste mode for indented blocks", async () => {
    const result = await runCli([], '.paste\nif ok\n  print "yes"\n\n.exit\n');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("paste mode");
    expect(result.stdout).toContain("INDENT");
    expect(result.stdout).toContain("DEDENT");
  });
});
