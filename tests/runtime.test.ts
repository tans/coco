import { describe, expect, test } from "bun:test";
import { CocoRuntime, RuntimeEventBus, RuntimePluginRegistry, RuntimeScheduler, parseRuntimeManifest } from "../src/runtime";

describe("Coco Runtime 1.0 base", () => {
  test("parses runtime manifests", () => {
    const manifest = parseRuntimeManifest({
      name: "demo",
      target: "bun",
      engines: {
        web: { enabled: true, adapter: "bun-http" },
        agent: true,
      },
      plugins: [{ name: "openai", engines: ["agent"], capabilities: ["tool-registry"] }],
      tasks: [{ id: "agent.respond", kind: "ai", event: "agent.task", engine: "agent" }],
    });

    expect(manifest.name).toBe("demo");
    expect(manifest.target).toBe("bun");
    expect(manifest.engines?.web).toEqual({ enabled: true, adapter: "bun-http" });
    expect(manifest.plugins?.[0]?.name).toBe("openai");
  });

  test("rejects invalid runtime targets and engines", () => {
    expect(() => parseRuntimeManifest({ name: "bad", target: "mobile" })).toThrow("Unsupported runtime target");
    expect(() => parseRuntimeManifest({ name: "bad", target: "bun", engines: { kernel: true } })).toThrow(
      "Unsupported runtime engine",
    );
  });

  test("builds a runtime plan with plugin capabilities", () => {
    const runtime = new CocoRuntime(
      parseRuntimeManifest({
        name: "demo",
        target: "bun",
        engines: { queue: true },
        plugins: [{ name: "redis", engines: ["queue"], capabilities: ["kv-memory"] }],
        tasks: [
          { id: "background.sync", kind: "background", event: "sync", engine: "queue" },
          { id: "agent.respond", kind: "ai", event: "agent.task", engine: "agent" },
        ],
      }),
    );

    const plan = runtime.plan();
    const queue = plan.engines.find((engine) => engine.kind === "queue");

    expect(queue?.enabled).toBe(true);
    expect(queue?.capabilities).toContain("kv-memory");
    expect(plan.events).toEqual(["agent.task", "sync"]);
    expect(plan.tasks.map((task) => task.id)).toEqual(["agent.respond", "background.sync"]);
  });

  test("dry-run emits registered events", async () => {
    const runtime = new CocoRuntime(
      parseRuntimeManifest({
        name: "demo",
        target: "bun",
        tasks: [{ id: "http.request", kind: "io", event: "http.request", engine: "web" }],
      }),
    );

    const seen: string[] = [];
    runtime.bus.on("http.request", (event) => {
      seen.push(event.type);
    });

    await runtime.dryRun();

    expect(seen).toEqual(["http.request"]);
  });

  test("event bus dispatches events", async () => {
    const bus = new RuntimeEventBus();
    const payloads: unknown[] = [];
    bus.on("demo", (event) => {
      payloads.push(event.payload);
    });

    await bus.emit("demo", { ok: true });

    expect(payloads).toEqual([{ ok: true }]);
    expect(bus.eventTypes()).toEqual(["demo"]);
  });

  test("scheduler sorts tasks by runtime priority", () => {
    const scheduler = new RuntimeScheduler();
    scheduler.add({ id: "background", kind: "background", event: "background" });
    scheduler.add({ id: "ui", kind: "ui", event: "ui" });
    scheduler.add({ id: "ai", kind: "ai", event: "ai" });

    expect(scheduler.plan().map((task) => task.id)).toEqual(["ui", "ai", "background"]);
  });

  test("plugin registry is independent from the compiler", () => {
    const registry = new RuntimePluginRegistry();
    registry.use({
      name: "test-plugin",
      register(context) {
        context.registerTask({ id: "test", kind: "io", event: "test" });
      },
    });

    expect(registry.plugins).toEqual(["test-plugin"]);
    expect(registry.tasks).toEqual([{ id: "test", kind: "io", event: "test" }]);
  });
});
