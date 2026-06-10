import { describe, expect, test } from "bun:test";

const cli = ["bun", "run", "src/cli.ts"];

async function runCli(args: string[]) {
  const proc = Bun.spawn([...cli, ...args], {
    cwd: import.meta.dir + "/..",
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout, stderr, exitCode };
}

describe("Coco runtime CLI", () => {
  test("prints runtime plan", async () => {
    const result = await runCli(["runtime", "plan", "examples/runtime/agent-web.json"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"name": "agent-web-demo"');
    expect(result.stdout).toContain('"kind": "agent"');
    expect(result.stdout).toContain('"event": "agent.task"');
  });

  test("runs runtime dry-run", async () => {
    const result = await runCli(["runtime", "dev", "examples/runtime/agent-web.json", "--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"events"');
    expect(result.stdout).toContain('"http.request"');
  });

  test("rejects runtime dev without dry-run", async () => {
    const result = await runCli(["runtime", "dev", "examples/runtime/agent-web.json"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Use --dry-run");
  });
});
