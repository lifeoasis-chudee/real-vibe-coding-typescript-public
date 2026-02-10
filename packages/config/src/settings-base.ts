/**
 * Base settings with config loading helper.
 *
 * Provides a factory for application settings that eliminates
 * duplication when loading configs from environment variables.
 */

import type { z } from "zod";
import { fromEnv } from "./config-base.js";

interface SettingsOptions {
  envFile?: string;
  caseSensitive?: boolean;
}

interface Settings<T> {
  config: T;
  envFile: string;
  caseSensitive: boolean;
}

/**
 * Create application settings from a Zod schema.
 *
 * @param schema - Zod schema defining settings fields
 * @param options - Settings options
 * @param options.envFile - Path to .env file (default: ".env")
 * @param options.caseSensitive - Case-sensitive env var matching (default: false)
 * @returns Settings object with parsed config and metadata
 */
export function createSettings<T extends z.ZodTypeAny>(
  schema: T,
  options: SettingsOptions = {},
): Settings<z.infer<T>> {
  const { envFile = ".env", caseSensitive = false } = options;

  const config = fromEnv(schema);

  return {
    config,
    envFile,
    caseSensitive,
  };
}

interface LoadConfigOptions {
  prefix?: string;
  separator?: string;
}

/**
 * Load a config from environment variables.
 *
 * Helper method equivalent to Python's SettingsBase._load_config().
 *
 * @param schema - Zod schema for the config
 * @param options - Loading options
 * @param options.prefix - Environment variable prefix (e.g., "REDIS_")
 * @returns Parsed config instance
 */
export function loadConfig<T extends z.ZodTypeAny>(
  schema: T,
  options: LoadConfigOptions = {},
): z.infer<T> {
  return fromEnv(schema, options);
}
