export interface RuntimeEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
  createdAt: string;
}

export type RuntimeEventHandler<TPayload = unknown> = (event: RuntimeEvent<TPayload>) => void | Promise<void>;

export class RuntimeEventBus {
  private readonly handlers = new Map<string, RuntimeEventHandler[]>();

  on(type: string, handler: RuntimeEventHandler): void {
    const current = this.handlers.get(type) ?? [];
    current.push(handler);
    this.handlers.set(type, current);
  }

  async emit<TPayload>(type: string, payload: TPayload): Promise<RuntimeEvent<TPayload>> {
    const event: RuntimeEvent<TPayload> = {
      type,
      payload,
      createdAt: new Date().toISOString(),
    };

    for (const handler of this.handlers.get(type) ?? []) {
      await handler(event);
    }

    return event;
  }

  eventTypes(): string[] {
    return [...this.handlers.keys()].sort();
  }
}
