#!/usr/bin/env bun
import { chmod, lstat, mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const cliPath = resolve(repoRoot, "src/cli.ts");
const bunHome = `${process.env.HOME}/.bun`;
const binDir = resolve(bunHome, "bin");

await mkdir(binDir, { recursive: true });

for (const command of ["coco", "cococ"]) {
  const target = resolve(binDir, command);
  const script = `#!/usr/bin/env bash
exec bun ${JSON.stringify(cliPath)} "$@"
`;

  await mkdir(dirname(target), { recursive: true });
  try {
    await lstat(target);
    await unlink(target);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }
  await writeFile(target, script, { mode: 0o755 });
  await chmod(target, 0o755);
  console.log(`installed ${command} -> ${cliPath}`);
}

console.log(`\nAdd this to your shell profile if needed:\n  export PATH="${binDir}:$PATH"`);
