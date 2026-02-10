---
name: config-skill
description: "Guide for creating and managing configuration in this TypeScript project. Use when creating config schemas, loading configuration from environment variables, implementing domain-specific configs (Redis, OpenAI, S3, etc.), or working with sensitive field masking. This skill defines the Zod-based config system: fromEnv() for env loading, createSettings() for app-level config, and loadConfig() for domain configs."
---

# Configuration System

Zod-based configuration with environment variable loading:
- **fromEnv()** for loading config from environment variables
- **createSettings()** for app-level settings
- **loadConfig()** for domain-specific configs
- **getPrintableConfig()** for masking sensitive fields
- **getExtraConfigs()** for extracting extra fields from passthrough schemas

## Imports

```typescript
import { fromEnv, getExtraConfigs, getPrintableConfig, createSettings, loadConfig } from "@my/config";
```

## Defining Config Schemas

Use Zod schemas to define config structures:

```typescript
import { z } from "zod";

const RedisConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.coerce.number().default(6379),
  password: z.string().optional(),
});
```

## Loading from Environment Variables

Use `fromEnv()` for explicit environment loading with prefix support:

```typescript
// From env vars with prefix (e.g., REDIS_HOST, REDIS_PORT)
const config = fromEnv(RedisConfigSchema, { prefix: "REDIS_" });

// Without prefix
const config = fromEnv(RedisConfigSchema);
```

**Environment variable mapping:**
- `REDIS_HOST` -> `host`
- `REDIS_PORT` -> `port`
- Keys are lowercased and prefix is stripped

### Boolean Coercion

Use Zod transforms for boolean env vars:

```typescript
const AppSchema = z.object({
  debug: z
    .string()
    .transform((v) => ["true", "1", "yes", "on"].includes(v.toLowerCase()))
    .default("false"),
});
```

## Sensitive Field Masking

Auto-masked by postfix: `*password`, `*pw`, `*key`, `*secret`, `*credentials`

```typescript
const config = fromEnv(ConfigWithSecretsSchema);
const printable = getPrintableConfig(config);
// { host: "localhost", api_key: "se...23", password: "my...rd" }
```

## Extra Fields (Passthrough)

Use Zod passthrough schemas for extra fields:

```typescript
const config = fromEnv(SampleConfigSchema.passthrough(), { prefix: "APP_" });
const extras = getExtraConfigs(config, SampleConfigSchema);
// Returns only fields not defined in the schema
```

## App-Level Settings

Use `createSettings()` for app-level configuration:

```typescript
const SettingsSchema = z.object({
  app_name: z.string().default("my-app"),
  worker_slots: z.coerce.number().default(5),
});

const settings = createSettings(SettingsSchema);
// settings.config.app_name, settings.envFile, settings.caseSensitive
```

## Domain Config Loading

Use `loadConfig()` as a shorthand for `fromEnv()` with options:

```typescript
const redis = loadConfig(RedisConfigSchema, { prefix: "REDIS_" });
// redis.host, redis.port
```

## Testing

Direct instantiation via Zod parse (no env dependencies):

```typescript
import { describe, expect, it, afterEach } from "vitest";
import { z } from "zod";
import { fromEnv, getPrintableConfig } from "@my/config";

describe("RedisConfig", () => {
  const originalEnv = { ...process.env };
  afterEach(() => { process.env = { ...originalEnv }; });

  it("should load from env vars", () => {
    process.env.REDIS_HOST = "redis.example.com";
    process.env.REDIS_PORT = "6380";
    const config = fromEnv(RedisConfigSchema, { prefix: "REDIS_" });
    expect(config.host).toBe("redis.example.com");
    expect(config.port).toBe(6380);
  });

  it("should mask sensitive fields", () => {
    const config = fromEnv(ConfigWithSecretsSchema);
    const printable = getPrintableConfig(config);
    expect(printable.api_key).toBe("se...23");
  });
});
```

## Key Principles

1. **Zod schemas define structure**: All config shapes are Zod schemas
2. **Explicit loading**: `fromEnv()` makes env loading clear and intentional
3. **Prefix convention**: Use `PREFIX_` to namespace env vars per domain
4. **Testing friendly**: Use defaults or set `process.env` in tests
5. **Type safety**: Full TypeScript inference from Zod schemas
