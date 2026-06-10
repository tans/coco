import { createBuiltinEngines, createEngine } from "./engines";
import { RuntimeEventBus } from "./event-bus";
import { RuntimeScheduler } from "./scheduler";
import type { RuntimeEngine, RuntimeEngineKind, RuntimeManifest, RuntimePlan, RuntimePlugin, RuntimeTask } from "./types";

export class CocoRuntime {
  readonly bus = new RuntimeEventBus();
  readonly scheduler = new RuntimeScheduler();
  readonly engines: RuntimeEngine[];
  readonly plugins: RuntimePlugin[];

  constructor(readonly manifest: RuntimeManifest) {
    this.engines = buildEngines(manifest);
    this.plugins = manifest.plugins ?? [];

    for (const task of manifest.tasks ?? []) {
      this.scheduler.add(task);
      this.bus.on(task.event, () => undefined);
    }
  }

  plan(): RuntimePlan {
    return {
      name: this.manifest.name,
      target: this.manifest.target,
      engines: this.engines,
      plugins: this.plugins,
      tasks: this.scheduler.plan(),
      events: this.bus.eventTypes(),
    };
  }

  async dryRun(): Promise<RuntimePlan> {
    for (const task of this.scheduler.plan()) {
      await this.bus.emit(task.event, { taskId: task.id, dryRun: true });
    }
    return this.plan();
  }
}

function buildEngines(manifest: RuntimeManifest): RuntimeEngine[] {
  const engines = new Map<RuntimeEngineKind, RuntimeEngine>();

  for (const engine of createBuiltinEngines()) {
    engines.set(engine.kind, engine);
  }

  for (const [kind, config] of Object.entries(manifest.engines ?? {}) as [
    RuntimeEngineKind,
    boolean | { enabled?: boolean; adapter?: string },
  ][]) {
    if (typeof config === "boolean") {
      engines.set(kind, createEngine(kind, config));
      continue;
    }

    engines.set(kind, createEngine(kind, config.enabled ?? true, config.adapter));
  }

  for (const plugin of manifest.plugins ?? []) {
    for (const kind of plugin.engines ?? []) {
      const existing = engines.get(kind);
      engines.set(kind, {
        ...(existing ?? createEngine(kind)),
        enabled: true,
        capabilities: unique([...(existing?.capabilities ?? []), ...(plugin.capabilities ?? [])]),
        ...(plugin.adapters?.[kind] ? { adapter: plugin.adapters[kind] } : {}),
      });
    }
  }

  return [...engines.values()].sort((left, right) => left.kind.localeCompare(right.kind));
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
