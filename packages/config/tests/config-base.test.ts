import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { fromEnv, getExtraConfigs, getPrintableConfig } from "../src/config-base.js";

const SampleConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.coerce.number().default(8080),
  debug: z
    .string()
    .transform((v) => ["true", "1", "yes", "on"].includes(v.toLowerCase()))
    .default("false"),
});

describe("ConfigBase", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should use default values when no env vars are set", () => {
    const config = fromEnv(SampleConfigSchema);

    expect(config.host).toBe("localhost");
    expect(config.port).toBe(8080);
    expect(config.debug).toBe(false);
  });

  it("should load config from env vars with prefix", () => {
    process.env.TEST_HOST = "example.com";
    process.env.TEST_PORT = "9000";
    process.env.TEST_DEBUG = "true";

    const config = fromEnv(SampleConfigSchema, { prefix: "TEST_" });

    expect(config.host).toBe("example.com");
    expect(config.port).toBe(9000);
    expect(config.debug).toBe(true);
  });

  it("should allow extra fields via passthrough", () => {
    process.env.APP_HOST = "test";
    process.env.APP_CUSTOM_FIELD = "value";

    const config = fromEnv(SampleConfigSchema.passthrough(), { prefix: "APP_" });

    expect(config.host).toBe("test");
    expect((config as Record<string, unknown>).custom_field).toBe("value");
  });

  it("should return only extra fields", () => {
    process.env.APP_HOST = "test";
    process.env.APP_EXTRA1 = "a";
    process.env.APP_EXTRA2 = "b";

    const config = fromEnv(SampleConfigSchema.passthrough(), { prefix: "APP_" });
    const extras = getExtraConfigs(config, SampleConfigSchema);

    expect(extras).toEqual({ extra1: "a", extra2: "b" });
    expect(extras).not.toHaveProperty("host");
  });

  it("should mask sensitive fields in printable config", () => {
    const ConfigWithSecretsSchema = z.object({
      api_key: z.string().default("secret123"),
      password: z.string().default("mypassword"),
      host: z.string().default("localhost"),
    });

    const config = fromEnv(ConfigWithSecretsSchema);
    const printable = getPrintableConfig(config);

    expect(printable.host).toBe("localhost");
    expect(printable.api_key).toBe("se...23");
    expect(printable.password).toBe("my...rd");
  });
});
