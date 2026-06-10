import type { RuntimeTask, RuntimeTaskKind } from "./types";

const taskPriority: Record<RuntimeTaskKind, number> = {
  ui: 10,
  io: 20,
  ai: 30,
  background: 40,
  "game-loop": 50,
};

export class RuntimeScheduler {
  private readonly tasks: RuntimeTask[] = [];

  add(task: RuntimeTask): void {
    this.tasks.push(task);
  }

  plan(): RuntimeTask[] {
    return [...this.tasks].sort((left, right) => {
      const priority = taskPriority[left.kind] - taskPriority[right.kind];
      if (priority !== 0) {
        return priority;
      }
      return left.id.localeCompare(right.id);
    });
  }
}
