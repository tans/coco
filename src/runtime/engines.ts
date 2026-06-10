import type { RuntimeEngine, RuntimeEngineKind } from "./types";

const builtinCapabilities: Record<RuntimeEngineKind, string[]> = {
  web: ["http-server", "router", "middleware", "static-files", "optional-ssr"],
  api: ["openapi-plan", "dto-validation-plan", "sdk-generation-plan"],
  agent: ["tool-registry", "model-adapter", "memory-plan", "multi-agent-plan"],
  workflow: ["event-trigger", "dag-plan", "step-runner-plan"],
  queue: ["async-task", "retry-plan", "dead-letter-plan"],
  db: ["adapter-plan", "schema-plan", "migration-plan"],
  ui: ["declarative-components", "page-plan", "chat-component-plan"],
  desktop: ["window-plan", "webview-adapter-plan", "native-bridge-plan"],
  game: ["canvas-plan", "sprite-plan", "input-plan", "audio-plan"],
};

export function createEngine(kind: RuntimeEngineKind, enabled = true, adapter?: string): RuntimeEngine {
  const engine: RuntimeEngine = {
    kind,
    enabled,
    capabilities: builtinCapabilities[kind],
  };

  if (adapter) {
    engine.adapter = adapter;
  }

  return engine;
}

export function createBuiltinEngines(): RuntimeEngine[] {
  return (Object.keys(builtinCapabilities) as RuntimeEngineKind[]).map((kind) => createEngine(kind, false));
}
