# Contributing

This repository is intentionally small. Keep changes scoped and testable.

## Development

```bash
bun install
bun test
bun run build
```

## Guidelines

- Keep the lexer deterministic and free of parser behavior.
- Add tests for every new token, diagnostic, or indentation rule.
- Preserve source locations on emitted tokens.
- Document user-facing syntax changes in `docs/` and `target.md`.
- Do not claim compiler stages are implemented until they have working code,
  tests, and documented behavior.
