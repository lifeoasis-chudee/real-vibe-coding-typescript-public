---
name: test-skill
description: Guide for writing and organizing tests in this TypeScript project. Use when creating new tests, choosing test patterns, writing fixtures, or structuring test directories.
---

# Test Skill

## Framework
- **Vitest** as the primary test framework
- Tests live in each workspace member's `tests/` directory

## Test Structure
```
packages/<member>/tests/
└── *.test.ts            # Vitest test files (flat structure)
```

## Naming Conventions
- Test files: `<module>.test.ts`
- Describe blocks: Module or function name
- Test names: Use descriptive `it("should ...")` format

## Test Patterns

### Basic Unit Test
```typescript
import { describe, expect, it } from "vitest";

describe("add", () => {
  it("should return sum of two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

### Setup and Teardown
```typescript
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("ConfigLoader", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should load from env vars", () => {
    process.env.MY_VAR = "value";
    // ... test
  });
});
```

### Testing with Zod Schemas
```typescript
import { z } from "zod";
import { fromEnv } from "../src/config-base.js";

const SampleSchema = z.object({
  host: z.string().default("localhost"),
  port: z.coerce.number().default(8080),
});

it("should use default values", () => {
  const config = fromEnv(SampleSchema);
  expect(config.host).toBe("localhost");
  expect(config.port).toBe(8080);
});
```

### Exception Testing
```typescript
it("should throw on invalid input", () => {
  expect(() => {
    processInput(-1);
  }).toThrow();
});
```

### Testing Logger Output
```typescript
it("should log without error", () => {
  const logger = getLogger("test");
  expect(() => {
    logger.info({ extraField: "value" }, "test message");
  }).not.toThrow();
});
```

## Assertion Style
- Use `expect()` with Vitest matchers
- `toBe()` for primitives, `toEqual()` for objects
- `toHaveProperty()` for checking object keys
- `not.toHaveProperty()` for ensuring absence

## Import Pattern
Always import test utilities from `vitest`:
```typescript
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
```

Import source with `.js` extension (TypeScript ESM convention):
```typescript
import { fromEnv } from "../src/config-base.js";
```

## Running Tests
```bash
# All tests
yarn test

# Watch mode
yarn test:watch

# Specific workspace member
yarn workspace @my/config run test
yarn workspace @my/logger run test

# Full CI (lint + typecheck + test)
make ci
```

## TDD Integration
Tests are written following the Red -> Green -> Refactor cycle:
1. Write a failing test first
2. Implement minimum code to pass
3. Refactor if needed (tests must stay green)
