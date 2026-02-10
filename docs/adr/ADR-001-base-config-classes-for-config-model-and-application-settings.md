# ADR-001: Zod-based Config Functions for Config Model and Application Settings

## Status

Accepted

## Date

2024-12-14

## Context

This project needs a configuration management system that meets the following requirements:

1. **Type Safety**: Full Zod validation and TypeScript type inference
2. **Environment Variable Loading**: Support for loading configuration from environment variables with prefix
3. **Sensitive Data Handling**: Ability to mask sensitive fields (passwords, API keys) in logs
4. **Extra Fields Support**: Handle unknown fields via Zod passthrough schemas
5. **Code Reusability**: Eliminate duplication when loading domain-specific configs across multiple services

## Decision

We implement a **function-based configuration system** using Zod schemas:

### 1. fromEnv() - Domain Config Loading

For domain-specific configurations (Redis, OpenAI, S3, Database, etc.)

```typescript
import { z } from "zod";
import { fromEnv } from "@my/config";

const RedisConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.coerce.number().default(6379),
  password: z.string().optional(),
});

// Explicitly load from environment variables
const config = fromEnv(RedisConfigSchema, { prefix: "REDIS_" });
```

Key characteristics:
- Does NOT auto-load from environment variables - requires explicit `fromEnv()` call
- Uses Zod schemas for validation and type inference
- Supports prefix-based env var namespacing
- Keys are lowercased and prefix is stripped

### 2. createSettings() - App-Level Settings

For application-level settings that orchestrate domain configs

```typescript
import { z } from "zod";
import { createSettings, loadConfig } from "@my/config";

const SettingsSchema = z.object({
  app_name: z.string().default("my-app"),
  worker_slots: z.coerce.number().default(5),
});

const settings = createSettings(SettingsSchema);
// settings.config.app_name, settings.envFile, settings.caseSensitive
```

### 3. Helper Functions

```typescript
import { getPrintableConfig, getExtraConfigs } from "@my/config";

// Mask sensitive fields for logging
const printable = getPrintableConfig(config);
// { host: "localhost", password: "se...23" }

// Extract extra fields from passthrough schemas
const extras = getExtraConfigs(config, RedisConfigSchema);
```

### Usage Pattern

```typescript
import { z } from "zod";
import { loadConfig, getPrintableConfig } from "@my/config";

const RedisConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.coerce.number().default(6379),
});

const OpenAIConfigSchema = z.object({
  api_key: z.string(),
  model: z.string().default("gpt-4"),
});

// Load domain configs with prefix
const redis = loadConfig(RedisConfigSchema, { prefix: "REDIS_" });
const openai = loadConfig(OpenAIConfigSchema, { prefix: "OPENAI_" });
```

## Rationale

### Why function-based instead of class-based?

1. **Simplicity**: Plain functions + Zod schemas are simpler than class hierarchies
2. **Composability**: Functions compose better than class inheritance
3. **TypeScript Idiomatic**: Zod schemas with `z.infer<T>` provide excellent type inference
4. **Tree-shakeable**: Functions can be individually imported
5. **Testing Friendly**: No class instantiation needed; just pass env vars

### Why Zod?

1. **TypeScript-first**: Schema inference generates types automatically
2. **Runtime Validation**: Validates at runtime, not just compile-time
3. **Coercion Support**: `z.coerce.number()` handles string-to-number from env vars
4. **Composable**: `.passthrough()`, `.default()`, `.transform()` chain cleanly
5. **Already in Stack**: Zod is a project dependency

## Alternatives Considered

### Class-based Configuration (Pydantic-style)

- Pros: Familiar OOP pattern, auto-loading via inheritance
- Cons: Heavier abstraction, less TypeScript-idiomatic, class hierarchies add complexity
- Why rejected: Function-based approach is simpler and more aligned with TypeScript patterns

### Environment-only Configuration (No .env Files)

- Pros: Simpler, follows 12-factor app principles strictly
- Cons: Poor developer experience for local development
- Why rejected: Developer experience matters; `.env` files are standard practice

### io-ts or Arktype

- Pros: Also TypeScript-first validation libraries
- Cons: Smaller ecosystem, less community support
- Why rejected: Zod has the largest ecosystem and best TypeScript integration

## Consequences

### Positive

- Full TypeScript type safety with Zod schema inference
- Simple, composable function-based API
- Sensitive fields automatically masked in logs
- Consistent loading pattern across all configs
- Extra fields supported via passthrough schemas
- Testing friendly - no env setup needed with defaults

### Negative

- No auto-loading; must explicitly call `fromEnv()` (deliberate trade-off)
- Env vars are always strings; need coercion for numbers/booleans
- No nested model support (flat key-value mapping only)

### Risks

- Future Zod major version changes may require updates
- Large numbers of env vars with same prefix could conflict
