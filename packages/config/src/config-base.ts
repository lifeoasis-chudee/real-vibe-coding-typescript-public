/**
 * Base configuration with environment variable loading support.
 *
 * Features:
 * - Supports extra fields via Zod passthrough schemas
 * - Provides fromEnv() for loading from environment variables with prefix
 * - Provides getPrintableConfig() for masked sensitive field output
 * - Full Zod validation and TypeScript type safety
 */

import type { z } from "zod";

const SENSITIVE_POSTFIXES = ["password", "pw", "key", "secret", "credentials"];

function isSensitive(key: string): boolean {
  const keyLower = key.toLowerCase();
  return SENSITIVE_POSTFIXES.some((postfix) => keyLower.endsWith(postfix));
}

function maskValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "<not set>";
  }
  if (typeof value !== "string") {
    return "****";
  }
  if (value.length <= 4) {
    return "****";
  }
  return `${value.slice(0, 2)}...${value.slice(-2)}`;
}

interface FromEnvOptions {
  prefix?: string;
  separator?: string;
}

function toFieldName(envKey: string, separator: string): string {
  return separator === "_"
    ? envKey.toLowerCase()
    : envKey.replace(new RegExp(separator, "g"), "_").toLowerCase();
}

function collectEnvValues(prefix: string, separator: string): Record<string, unknown> {
  const prefixUpper = prefix.toUpperCase();
  const envValues: Record<string, unknown> = {};

  for (const [envKey, envValue] of Object.entries(process.env)) {
    if (envValue === undefined) continue;

    if (prefixUpper && envKey.startsWith(prefixUpper)) {
      envValues[toFieldName(envKey.slice(prefixUpper.length), separator)] = envValue;
    } else if (!prefixUpper) {
      envValues[toFieldName(envKey, separator)] = envValue;
    }
  }

  return envValues;
}

/**
 * Load configuration from environment variables.
 *
 * @param schema - Zod schema defining the config structure
 * @param options - Options for env var loading
 * @param options.prefix - Environment variable prefix (e.g., "REDIS_")
 * @param options.separator - Separator for field names (default: "_")
 * @returns Parsed and validated config object
 */
export function fromEnv<T extends z.ZodTypeAny>(
  schema: T,
  options: FromEnvOptions = {},
): z.infer<T> {
  const { prefix = "", separator = "_" } = options;
  const envValues = collectEnvValues(prefix, separator);
  return schema.parse(envValues);
}

/**
 * Get extra fields that are not part of the schema definition.
 *
 * @param config - Parsed config object (from a passthrough schema)
 * @param schema - Original Zod schema (without passthrough)
 * @returns Object containing only extra fields
 */
export function getExtraConfigs<T extends z.ZodObject<z.ZodRawShape>>(
  config: Record<string, unknown>,
  schema: T,
): Record<string, unknown> {
  const schemaKeys = new Set(Object.keys(schema.shape));
  const extras: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (!schemaKeys.has(key)) {
      extras[key] = value;
    }
  }

  return extras;
}

/**
 * Get printable representation with sensitive values masked.
 *
 * Sensitive fields are detected by key postfix:
 * - *password, *pw, *key, *secret, *credentials
 *
 * @param config - Config object to mask
 * @returns Object with sensitive fields masked
 */
export function getPrintableConfig(config: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    result[key] = isSensitive(key) ? maskValue(value) : value;
  }

  return result;
}
