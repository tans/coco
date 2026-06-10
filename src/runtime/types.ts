export type RuntimeEngineKind =
  | "web"
  | "api"
  | "agent"
  | "workflow"
  | "queue"
  | "db"
  | "ui"
  | "desktop"
  | "game";

export type RuntimeTarget = "bun" | "node" | "deno" | "web" | "desktop" | "game";

export type RuntimeTaskKind = "io" | "ai" | "ui" | "background" | "game-loop";

export interface RuntimeEngine {
  kind: RuntimeEngineKind;
  enabled: boolean;
  adapter?: string;
  capabilities: string[];
}

export interface RuntimePlugin {
  name: string;
  engines?: RuntimeEngineKind[];
  adapters?: Record<string, string>;
  capabilities?: string[];
}

export interface RuntimeManifest {
  name: string;
  target: RuntimeTarget;
  engines?: Partial<Record<RuntimeEngineKind, boolean | { enabled?: boolean; adapter?: string }>>;
  plugins?: RuntimePlugin[];
  tasks?: RuntimeTask[];
}

export interface RuntimeTask {
  id: string;
  kind: RuntimeTaskKind;
  event: string;
  engine?: RuntimeEngineKind;
}

export interface RuntimePlan {
  name: string;
  target: RuntimeTarget;
  engines: RuntimeEngine[];
  plugins: RuntimePlugin[];
  tasks: RuntimeTask[];
  events: string[];
}

export interface RuntimePluginContext {
  registerEngine(engine: RuntimeEngine): void;
  registerTask(task: RuntimeTask): void;
}

export interface RuntimePluginModule {
  name: string;
  register(context: RuntimePluginContext): void;
}
