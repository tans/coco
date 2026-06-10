import { readFile } from "node:fs/promises";
import type { RuntimeEngineKind, RuntimeManifest, RuntimeTarget, RuntimeTaskKind } from "./types";

const engineKinds = new Set<RuntimeEngineKind>([
  "web",
  "api",
  "agent",
  "workflow",
  "queue",
  "db",
  "ui",
  "desktop",
  "game",
]);

const targets = new Set<RuntimeTarget>(["bun", "node", "deno", "web", "desktop", "game"]);
const taskKinds = new Set<RuntimeTaskKind>(["io", "ai", "ui", "background", "game-loop"]);

export async function loadRuntimeManifest(file: string): Promise<RuntimeManifest> {
  const raw = await readFile(file, "utf8");
  return parseRuntimeManifest(JSON.parse(raw));
}

export function parseRuntimeManifest(value: unknown): RuntimeManifest {
  if (!isRecord(value)) {
    throw new Error("Runtime manifest must be a JSON object");
  }

  const name = expectString(value.name, "name");
  const target = expectString(value.target, "target") as RuntimeTarget;
  if (!targets.has(target)) {
    throw new Error(`Unsupported runtime target: ${target}`);
  }

  const manifest: RuntimeManifest = { name, target };

  if (value.engines !== undefined) {
    if (!isRecord(value.engines)) {
      throw new Error("engines must be an object");
    }

    manifest.engines = {};
    for (const [kind, config] of Object.entries(value.engines)) {
      if (!engineKinds.has(kind as RuntimeEngineKind)) {
        throw new Error(`Unsupported runtime engine: ${kind}`);
      }
      if (typeof config === "boolean") {
        manifest.engines[kind as RuntimeEngineKind] = config;
      } else if (isRecord(config)) {
        manifest.engines[kind as RuntimeEngineKind] = {
          enabled: config.enabled === undefined ? true : expectBoolean(config.enabled, `${kind}.enabled`),
          ...(config.adapter === undefined ? {} : { adapter: expectString(config.adapter, `${kind}.adapter`) }),
        };
      } else {
        throw new Error(`Invalid engine config for ${kind}`);
      }
    }
  }

  if (value.plugins !== undefined) {
    if (!Array.isArray(value.plugins)) {
      throw new Error("plugins must be an array");
    }

    manifest.plugins = value.plugins.map((plugin, index) => {
      if (!isRecord(plugin)) {
        throw new Error(`plugins[${index}] must be an object`);
      }
      return {
        name: expectString(plugin.name, `plugins[${index}].name`),
        ...(Array.isArray(plugin.engines) ? { engines: plugin.engines.map((engine) => expectEngine(engine)) } : {}),
        ...(isRecord(plugin.adapters) ? { adapters: expectStringRecord(plugin.adapters, `plugins[${index}].adapters`) } : {}),
        ...(Array.isArray(plugin.capabilities)
          ? { capabilities: plugin.capabilities.map((capability) => expectString(capability, `plugins[${index}].capabilities`)) }
          : {}),
      };
    });
  }

  if (value.tasks !== undefined) {
    if (!Array.isArray(value.tasks)) {
      throw new Error("tasks must be an array");
    }

    manifest.tasks = value.tasks.map((task, index) => {
      if (!isRecord(task)) {
        throw new Error(`tasks[${index}] must be an object`);
      }
      const kind = expectString(task.kind, `tasks[${index}].kind`) as RuntimeTaskKind;
      if (!taskKinds.has(kind)) {
        throw new Error(`Unsupported task kind: ${kind}`);
      }
      return {
        id: expectString(task.id, `tasks[${index}].id`),
        kind,
        event: expectString(task.event, `tasks[${index}].event`),
        ...(task.engine === undefined ? {} : { engine: expectEngine(task.engine) }),
      };
    });
  }

  return manifest;
}

function expectEngine(value: unknown): RuntimeEngineKind {
  const engine = expectString(value, "engine") as RuntimeEngineKind;
  if (!engineKinds.has(engine)) {
    throw new Error(`Unsupported runtime engine: ${engine}`);
  }
  return engine;
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function expectBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean`);
  }
  return value;
}

function expectStringRecord(value: Record<string, unknown>, field: string): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    output[key] = expectString(item, `${field}.${key}`);
  }
  return output;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
