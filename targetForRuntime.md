# Coco Runtime 1.0 Target

Coco Runtime is an optional runtime layer for building modern applications on
top of Coco. It must remain architecturally separate from the Coco language
core so users can choose:

```text
language only
language + runtime base
language + runtime base + selected adapters/plugins
```

This document is the runtime target for the current repository. Technical
details are allowed to evolve as the compiler matures, but the separation rule
is not optional.

## 1. Separation Requirement

Language core:

```text
src/token.ts
src/lexer.ts
src/index.ts
```

Runtime base:

```text
src/runtime/*
```

Rules:

- Language modules must not import runtime modules.
- Runtime modules may consume language output in the future, but not the other
  way around.
- CLI may dynamically import runtime only for `coco runtime ...` commands.
- Real adapters such as OpenAI, Redis, PixiJS, Tauri, and database drivers
  should live outside the core package.

Future package direction:

```text
@coco/lang
@coco/runtime
@coco/cli
@coco/plugin-openai
@coco/plugin-redis
@coco/plugin-pixijs
@coco/plugin-tauri
```

## 2. Current Runtime 1.0 Base

Implemented:

- Runtime manifest parser and validator
- Built-in engine descriptors
- Event bus
- Scheduler
- Plugin registry API
- Runtime plan generation
- Runtime dry-run event emission
- CLI commands:
  - `coco runtime inspect <manifest.json>`
  - `coco runtime plan <manifest.json>`
  - `coco runtime dev <manifest.json> --dry-run`

The current runtime input is JSON manifest because the Coco parser is not
implemented yet. Future `.coco` runtime DSL should compile into the same
manifest structure.

## 3. Runtime Architecture

```text
          +------------------+
          |   Coco Language  |
          +--------+---------+
                   |
          +--------v---------+
          |   Coco Compiler  |
          +--------+---------+
                   |
          +--------v---------+
          | Runtime Manifest |
          +--------+---------+
                   |
          +--------v---------+
          | Optional Runtime |
          +--------+---------+
                   |
  +--------+--------+--------+--------+--------+
  |   Web   |   API  | Agent  | Desktop | Game  |
  +--------+--------+--------+--------+--------+
```

## 4. Engine System

Runtime engines are descriptors in this milestone.

```text
web
api
agent
workflow
queue
db
ui
desktop
game
```

They define capability and adapter boundaries without pulling in heavy
dependencies.

## 5. Engine Responsibilities

### Web Runtime

Planned responsibilities:

- HTTP server
- Router
- Middleware
- Static file serving
- Optional SSR

Current implementation:

- Capability descriptor
- Adapter field, e.g. `bun-http`

### API Runtime

Planned responsibilities:

- OpenAPI generation
- DTO validation
- SDK generation

Current implementation:

- Capability descriptor

### Agent Runtime

Planned responsibilities:

- LLM dispatch
- Tool registry
- Memory
- Multi-agent orchestration

Current implementation:

- Capability descriptor
- Plugin capability merging

### Workflow Runtime

Planned responsibilities:

- DAG execution
- Event-driven triggers
- Step runner

Current implementation:

- Event names and task scheduling plan

### Queue Runtime

Planned responsibilities:

- Async jobs
- Retry
- Dead letter queue

Current implementation:

- Capability descriptor and background task plan

### DB Runtime

Planned responsibilities:

- Adapter abstraction
- Schema
- Migration

Current implementation:

- Capability descriptor only

### Desktop Runtime

Planned responsibilities:

- Window manager
- WebView shell
- Native bridge

Current implementation:

- Capability descriptor and adapter boundary

### Game Runtime

Planned responsibilities:

- 2D rendering
- Sprite system
- Input system
- Audio
- AI NPC integration

Current implementation:

- Capability descriptor and game-loop task kind

## 6. Runtime Target System

Supported target values in manifests:

```text
bun
node
deno
web
desktop
game
```

These are validated now. Actual target-specific build output is future work.

## 7. Execution Model

All runtime surfaces should converge through an event bus:

```text
HTTP request
Agent task
Queue message
Workflow event
UI event
Game loop
```

Current implementation:

- `RuntimeEventBus`
- `RuntimeScheduler`
- `CocoRuntime.dryRun()`

## 8. Plugin System

Current plugin interface:

```ts
interface RuntimePluginModule {
  name: string
  register(context: RuntimePluginContext): void
}
```

Plugins can register:

- engines
- tasks

Manifest plugins can declare:

- name
- engines
- adapters
- capabilities

## 9. CLI

```bash
coco runtime inspect examples/runtime/agent-web.json
coco runtime plan examples/runtime/agent-web.json
coco runtime dev examples/runtime/agent-web.json --dry-run
```

`dev` currently requires `--dry-run` because real adapters are intentionally not
bundled.

## 10. AI Native Layer

AI-native runtime design remains a core goal:

- Agent engine
- Tool registry
- Memory layer
- Multi-agent orchestration
- Workflow integration

Current implementation expresses these as engine capabilities and plugin
boundaries. Provider calls are future plugin work.

## 11. Design Constraints

Coco Runtime deliberately avoids:

```text
Kernel-level programming
GPU compute runtime
Heavy game engine features
Low-level rendering pipeline
Bundling all adapters into the language core
```

Goal:

> Provide an extensible 80% application runtime while keeping the language core
> installable on its own.

## 12. Acceptance Criteria

This milestone is complete when:

- Runtime code is separated under `src/runtime`.
- Language core does not import runtime.
- Runtime manifests can be parsed and validated.
- Runtime plans can be generated.
- Dry-run event emission works.
- Plugin registry has tests.
- CLI exposes runtime commands through dynamic import.
- Docs explain optional installation and future package split.
- Examples exist under `examples/runtime`.
- Tests cover runtime API and CLI behavior.
