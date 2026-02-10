import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createSettings, loadConfig } from "../src/settings-base.js";

const RedisConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.coerce.number().default(6379),
});

describe("SettingsBase", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should have default settings config", () => {
    const SettingsSchema = z.object({
      app_name: z.string().default("test"),
    });

    const settings = createSettings(SettingsSchema);

    expect(settings.envFile).toBe(".env");
    expect(settings.caseSensitive).toBe(false);
    expect(settings.config.app_name).toBe("test");
  });

  it("should load config via helper method", () => {
    process.env.REDIS_HOST = "redis.example.com";
    process.env.REDIS_PORT = "6380";

    const redis = loadConfig(RedisConfigSchema, { prefix: "REDIS_" });

    expect(redis.host).toBe("redis.example.com");
    expect(redis.port).toBe(6380);
  });

  it("should use defaults when env vars not set", () => {
    const redis = loadConfig(RedisConfigSchema, { prefix: "REDIS_" });

    expect(redis.host).toBe("localhost");
    expect(redis.port).toBe(6379);
  });
});
