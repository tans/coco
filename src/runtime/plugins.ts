import type { RuntimeEngine, RuntimePluginContext, RuntimePluginModule, RuntimeTask } from "./types";

export class RuntimePluginRegistry implements RuntimePluginContext {
  readonly engines: RuntimeEngine[] = [];
  readonly tasks: RuntimeTask[] = [];
  readonly plugins: string[] = [];

  use(plugin: RuntimePluginModule): void {
    this.plugins.push(plugin.name);
    plugin.register(this);
  }

  registerEngine(engine: RuntimeEngine): void {
    this.engines.push(engine);
  }

  registerTask(task: RuntimeTask): void {
    this.tasks.push(task);
  }
}
