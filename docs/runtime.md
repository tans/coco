# Coco Runtime

Coco Runtime is an optional application-runtime layer for Coco. It is separated
from the language lexer/compiler so users can install only the language tools,
or add runtime support when they need application orchestration.

## Separation Model

```text
coco language core
  src/token.ts
  src/lexer.ts
  src/index.ts

optional runtime base
  src/runtime/*
```

The language core does not import the runtime. The CLI loads runtime code only
when a `coco runtime ...` command is used.

Future package split:

```text
@coco/lang       lexer, parser, AST, emitter
@coco/runtime    event bus, scheduler, manifest, plugin registry
@coco/cli        command dispatch
@coco/plugin-*   optional adapters such as openai, redis, pixijs, tauri
```

Current package exports already follow that boundary:

```ts
import { tokenize } from "coco-lang";
import { CocoRuntime } from "coco-lang/runtime";
```

## Current Implementation

Implemented:

- Runtime manifest parser and validator
- Built-in engine descriptors for `web`, `api`, `agent`, `workflow`, `queue`,
  `db`, `ui`, `desktop`, and `game`
- Event bus
- Scheduler
- Plugin registry API
- Runtime plan generation
- Runtime dry-run event emission
- CLI commands:
  - `coco runtime inspect <manifest.json>`
  - `coco runtime plan <manifest.json>`
  - `coco runtime dev <manifest.json> --dry-run`

Not implemented yet:

- Real HTTP server adapters
- OpenAPI generation
- LLM provider calls
- Workflow DAG execution
- Queue backends
- DB adapters
- Desktop shell adapters
- Game rendering

## Manifest

Runtime 1.0 uses JSON manifests because the Coco parser is not implemented yet.
Later, `.coco` runtime syntax should compile into this same manifest model.

Example:

```json
{
  "name": "agent-web-demo",
  "target": "bun",
  "engines": {
    "web": {
      "enabled": true,
      "adapter": "bun-http"
    },
    "agent": {
      "enabled": true,
      "adapter": "openai"
    },
    "workflow": true
  },
  "plugins": [
    {
      "name": "openai",
      "engines": ["agent"],
      "capabilities": ["function-calling", "tool-registry"]
    }
  ],
  "tasks": [
    {
      "id": "agent.respond",
      "kind": "ai",
      "event": "agent.task",
      "engine": "agent"
    }
  ]
}
```

## Commands

Inspect normalized manifest:

```bash
coco runtime inspect examples/runtime/agent-web.json
```

Generate plan:

```bash
coco runtime plan examples/runtime/agent-web.json
```

Dry-run runtime events:

```bash
coco runtime dev examples/runtime/agent-web.json --dry-run
```

## Engine Scope

Runtime engines are descriptors in this milestone. They define capability and
adapter boundaries without pulling in heavy dependencies.

| Engine | Current role |
| --- | --- |
| web | HTTP/router/static/SSR capability plan |
| api | OpenAPI/DTO/SDK capability plan |
| agent | model/tool/memory/multi-agent capability plan |
| workflow | event/DAG/step-runner capability plan |
| queue | async/retry/dead-letter capability plan |
| db | adapter/schema/migration capability plan |
| ui | declarative component capability plan |
| desktop | window/webview/native bridge capability plan |
| game | canvas/sprite/input/audio capability plan |

## Plugin Boundary

Plugins can register engines and tasks through `RuntimePluginRegistry`.

```ts
import { RuntimePluginRegistry } from "./src/runtime";

const registry = new RuntimePluginRegistry();

registry.use({
  name: "redis",
  register(context) {
    context.registerTask({
      id: "queue.email",
      kind: "background",
      event: "queue.email",
      engine: "queue",
    });
  },
});
```

This API is intentionally small. Real adapters should live outside the language
core so users can choose what to install.

## Design Constraints

Coco Runtime deliberately avoids:

- Kernel-level programming
- GPU compute runtime
- Heavy game-engine features
- Low-level rendering pipeline

The goal is an extensible 80% application runtime, not a monolithic platform.
