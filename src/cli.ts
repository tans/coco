#!/usr/bin/env bun
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CocoSyntaxError, compile, parse, tokenize, type Token } from "./index";

type ReplMode = "compact" | "json";

const [command, file, ...rest] = Bun.argv.slice(2);

if (!command) {
  await startRepl();
  process.exit(0);
}

if (command === "--help" || command === "-h" || command === "help") {
  printHelp();
  process.exit(0);
}

if (command === "runtime") {
  await runRuntimeCommand(file, rest);
  process.exit(0);
}

if (command !== "lex" && command !== "parse" && command !== "compile" && command !== "run") {
  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

if (!file) {
  console.error("Missing input file.");
  printHelp();
  process.exit(1);
}

try {
  const source = await readFile(file, "utf8");
  if (command === "lex") {
    console.log(formatTokens(tokenize(source, { filename: file }), "json"));
  } else if (command === "parse") {
    console.log(JSON.stringify(parse(source, { filename: file }), null, 2));
  } else if (command === "compile") {
    const outputFile = parseOutputFile(rest);
    const js = compile(source, { filename: file });
    if (outputFile) {
      await writeFile(outputFile, js);
    } else {
      console.log(js);
    }
  } else if (command === "run") {
    await runCocoFile(source, file);
  }
} catch (error) {
  printDiagnostic(error, file);
  process.exit(1);
}

export async function startRepl(): Promise<void> {
  if (!input.isTTY) {
    await runPipedRepl();
    return;
  }

  const repl = createInterface({ input, output });
  let mode: ReplMode = "compact";
  let buffer: string[] = [];
  let pasteMode = false;

  console.log("Coco REPL");
  console.log('Type Coco code to tokenize it. Commands: .help, .paste, .tokens, .clear, .exit');

  while (true) {
    const prompt = pasteMode ? "... " : "coco> ";
    const line = await repl.question(prompt);
    const trimmed = line.trim();

    if (trimmed === ".exit" || trimmed === ".quit") {
      break;
    }

    if (trimmed === ".help") {
      printReplHelp();
      continue;
    }

    if (trimmed === ".tokens") {
      mode = mode === "compact" ? "json" : "compact";
      console.log(`token output: ${mode}`);
      continue;
    }

    if (trimmed === ".paste") {
      pasteMode = true;
      buffer = [];
      console.log("paste mode: submit an empty line to tokenize");
      continue;
    }

    if (trimmed === ".clear") {
      buffer = [];
      pasteMode = false;
      console.log("buffer cleared");
      continue;
    }

    if (pasteMode) {
      if (trimmed !== "") {
        buffer.push(line);
        continue;
      }

      if (buffer.length === 0) {
        pasteMode = false;
        continue;
      }
      evaluateReplSource(buffer.join("\n"), mode);
      buffer = [];
      pasteMode = false;
      continue;
    }

    if (trimmed !== "") {
      evaluateReplSource(line, mode);
    }
  }

  repl.close();
}

async function runPipedRepl(): Promise<void> {
  const source = await Bun.stdin.text();
  const lines = source.split(/\r?\n/);
  let mode: ReplMode = "compact";
  let pasteMode = false;
  let buffer: string[] = [];

  console.log("Coco REPL");

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === ".exit" || trimmed === ".quit") {
      break;
    }

    if (trimmed === ".help") {
      printReplHelp();
      continue;
    }

    if (trimmed === ".tokens") {
      mode = mode === "compact" ? "json" : "compact";
      console.log(`token output: ${mode}`);
      continue;
    }

    if (trimmed === ".paste") {
      pasteMode = true;
      buffer = [];
      console.log("paste mode: submit an empty line to tokenize");
      continue;
    }

    if (trimmed === ".clear") {
      buffer = [];
      pasteMode = false;
      console.log("buffer cleared");
      continue;
    }

    if (pasteMode) {
      if (trimmed !== "") {
        buffer.push(line);
        continue;
      }

      if (buffer.length > 0) {
        evaluateReplSource(buffer.join("\n"), mode);
      }
      buffer = [];
      pasteMode = false;
      continue;
    }

    if (trimmed !== "") {
      evaluateReplSource(line, mode);
    }
  }

  if (pasteMode && buffer.length > 0) {
    evaluateReplSource(buffer.join("\n"), mode);
  }
}

export function formatTokens(tokens: Token[], mode: ReplMode): string {
  if (mode === "json") {
    return JSON.stringify(tokens, null, 2);
  }

  return tokens
    .filter((token) => token.type !== "EOF")
    .map((token) => {
      const value = token.lexeme === "" ? "" : `(${JSON.stringify(token.lexeme)})`;
      return `${token.type}${value}`;
    })
    .join(" ");
}

function evaluateReplSource(source: string, mode: ReplMode): void {
  try {
    const normalizedSource = source.endsWith("\n") ? source : `${source}\n`;
    console.log(formatTokens(tokenize(normalizedSource), mode));
  } catch (error) {
    printDiagnostic(error, "<repl>");
  }
}

function printDiagnostic(error: unknown, file: string): void {
  if (error instanceof CocoSyntaxError) {
    console.error(`${basename(file)}:${error.line}:${error.column}: ${error.message}`);
    return;
  }

  if (error instanceof Error) {
    console.error(`${basename(file)}: ${error.message}`);
    return;
  }

  throw error;
}

function printHelp(): void {
  console.log(`coco - Coco compiler prototype

Usage:
  coco                    Start the Coco REPL
  coco lex <file.coco>    Tokenize a .coco file and print JSON tokens
  coco parse <file.coco>  Parse a .coco file and print AST JSON
  coco compile <file.coco> [-o output.js]
                          Compile a .coco file to JavaScript
  coco run <file.coco>    Compile and execute a .coco file with Bun
  coco runtime <cmd>       Inspect or dry-run a Coco runtime manifest
  cococ lex <file.coco>   Compiler-style alias for coco lex

Runtime commands:
  runtime inspect <manifest.json>      Validate and print normalized manifest
  runtime plan <manifest.json>         Print runtime engine/task plan
  runtime dev <manifest.json> --dry-run Emit runtime events without adapters

REPL commands:
  .help     Show REPL help
  .paste    Enter multi-line input mode
  .tokens   Toggle compact token output and JSON token output
  .clear    Clear the current multi-line input buffer
  .exit     Exit the REPL
`);
}

function parseOutputFile(args: string[]): string | null {
  const outputIndex = args.findIndex((arg) => arg === "-o" || arg === "--output");
  if (outputIndex === -1) {
    return null;
  }

  const outputFile = args[outputIndex + 1];
  if (!outputFile) {
    throw new Error("Missing output file after -o");
  }

  return outputFile;
}

async function runCocoFile(source: string, file: string): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "coco-run-"));
  const jsFile = join(dir, `${basename(file, ".coco")}.mjs`);

  try {
    await writeFile(jsFile, compile(source, { filename: file }));
    const proc = Bun.spawn(["bun", jsFile], {
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function runRuntimeCommand(subcommand: string | undefined, args: string[]): Promise<void> {
  const manifestFile = args.find((arg) => !arg.startsWith("-"));

  if (!subcommand || subcommand === "--help" || subcommand === "-h" || subcommand === "help") {
    printRuntimeHelp();
    return;
  }

  if (!manifestFile) {
    console.error("Missing runtime manifest file.");
    printRuntimeHelp();
    process.exit(1);
  }

  const { CocoRuntime, loadRuntimeManifest } = await import("./runtime/index");

  try {
    const manifest = await loadRuntimeManifest(manifestFile);

    if (subcommand === "inspect") {
      console.log(JSON.stringify(manifest, null, 2));
      return;
    }

    const runtime = new CocoRuntime(manifest);

    if (subcommand === "plan") {
      console.log(JSON.stringify(runtime.plan(), null, 2));
      return;
    }

    if (subcommand === "dev") {
      if (!args.includes("--dry-run")) {
        console.error("Runtime adapters are not started yet. Use --dry-run for the current Runtime 1.0 base.");
        process.exit(1);
      }
      console.log(JSON.stringify(await runtime.dryRun(), null, 2));
      return;
    }

    console.error(`Unknown runtime command: ${subcommand}`);
    printRuntimeHelp();
    process.exit(1);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`${basename(manifestFile)}: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

function printRuntimeHelp(): void {
  console.log(`coco runtime - optional Coco Runtime 1.0 base

Usage:
  coco runtime inspect <manifest.json>
  coco runtime plan <manifest.json>
  coco runtime dev <manifest.json> --dry-run

The runtime is manifest-driven in this milestone. It is intentionally separated
from the language lexer/compiler so users can install or skip runtime support.
`);
}

function printReplHelp(): void {
  console.log(`Coco REPL help

Type a Coco line and press Enter to tokenize it:
  const name = "Coco"

For a multi-line block, use .paste and submit an empty line when the block is
complete:
  .paste
  if ok
    print "yes"

Commands:
  .paste    Enter multi-line input mode
  .tokens   Toggle compact token output and JSON token output
  .clear    Clear the current multi-line input buffer
  .exit     Exit the REPL
`);
}
