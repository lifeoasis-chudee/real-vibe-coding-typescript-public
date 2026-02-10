/**
 * Structured logging configuration using pino.
 *
 * Provides unified structured logging across all modules with:
 * - Console logging (pretty for TTY, JSON for pipes)
 * - File logging (JSON format)
 * - Per-logger level control (hierarchical)
 * - Configurable from environment: LOGGING_LEVELS or LOGGING_LEVELS_FILE
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import yaml from "js-yaml";
import { pino } from "pino";
import type { Logger, LoggerOptions } from "pino";

/** Root logger instance */
let rootLogger: Logger = pino({ level: "info" });

/** Per-logger level overrides */
let loggerLevels: Record<string, string> = {};

function loadDotenvFile(): void {
  let dir = process.cwd();
  while (true) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

function flattenYamlDict(data: Record<string, unknown>, parentKey = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenYamlDict(value as Record<string, unknown>, newKey));
    } else if (typeof value === "string") {
      result[newKey] = value;
    }
  }
  return result;
}

function loadLoggingLevelsFromFile(filePath: string): Record<string, string> | null {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    process.stderr.write(`Warning: Logger levels file not found: ${resolvedPath}\n`);
    return null;
  }

  let content: string;
  try {
    content = fs.readFileSync(resolvedPath, "utf-8");
  } catch (e) {
    process.stderr.write(`Warning: Failed to read logger levels file ${filePath}: ${e}\n`);
    return null;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  let parsed: unknown;

  try {
    if (ext === ".json") {
      parsed = JSON.parse(content);
    } else if (ext === ".yaml" || ext === ".yml") {
      parsed = yaml.load(content);
    } else {
      process.stderr.write(
        `Warning: Unsupported file extension: ${ext} (use .json, .yaml, or .yml)\n`,
      );
      return null;
    }
  } catch (e) {
    process.stderr.write(`Warning: Failed to parse logger levels file ${filePath}: ${e}\n`);
    return null;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    process.stderr.write("Warning: Logger levels file must contain an object\n");
    return null;
  }

  const flattened = flattenYamlDict(parsed as Record<string, unknown>);
  const result: Record<string, string> = {};
  for (const [name, level] of Object.entries(flattened)) {
    result[name] = level.toUpperCase() === "WARN" ? "warn" : level.toLowerCase();
  }
  return result;
}

function loadLoggingLevelsFromEnv(): Record<string, string> | null {
  const filePath = process.env.LOGGING_LEVELS_FILE;
  if (filePath) {
    const result = loadLoggingLevelsFromFile(filePath);
    if (result !== null) return result;
  }

  const envValue = process.env.LOGGING_LEVELS;
  if (!envValue) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(envValue);
  } catch {
    try {
      parsed = yaml.load(envValue);
    } catch (e) {
      process.stderr.write(`Warning: Failed to parse LOGGING_LEVELS as JSON or YAML: ${e}\n`);
      return null;
    }
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    process.stderr.write("Warning: LOGGING_LEVELS must be an object\n");
    return null;
  }

  const flattened = flattenYamlDict(parsed as Record<string, unknown>);
  const result: Record<string, string> = {};
  for (const [name, level] of Object.entries(flattened)) {
    result[name] = level.toUpperCase() === "WARN" ? "warn" : level.toLowerCase();
  }
  return result;
}

interface ConfigureLoggingOptions {
  logLevel?: string;
  logFile?: string;
  logFileLevel?: string;
  loggingLevels?: Record<string, string> | null;
}

/**
 * Configure structured logging with unified format.
 *
 * @param options - Configuration options
 * @param options.logLevel - Console log level (default: "info")
 * @param options.logFile - Optional JSON log file path
 * @param options.logFileLevel - Log level for file output (default: "warn")
 * @param options.loggingLevels - Per-logger levels. If null, reads from LOGGING_LEVELS env var
 */
export function configureLogging(options: ConfigureLoggingOptions = {}): void {
  const { logLevel = "info", logFile, logFileLevel = "warn", loggingLevels = undefined } = options;

  loadDotenvFile();

  const resolvedLevels = loggingLevels === undefined ? loadLoggingLevelsFromEnv() : loggingLevels;
  if (resolvedLevels) {
    loggerLevels = resolvedLevels;
  }

  const isTTY = process.stdout.isTTY ?? false;

  const pinoOptions: LoggerOptions = {
    level: logLevel.toLowerCase(),
  };

  const targets: pino.TransportTargetOptions[] = [];

  if (isTTY) {
    targets.push({
      target: "pino-pretty",
      level: logLevel.toLowerCase(),
      options: { colorize: true, translateTime: "yyyy-mm-dd HH:MM:ss.l" },
    });
  } else {
    targets.push({
      target: "pino/file",
      level: logLevel.toLowerCase(),
      options: { destination: 1 }, // stdout
    });
  }

  if (logFile) {
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    targets.push({
      target: "pino/file",
      level: logFileLevel.toLowerCase(),
      options: { destination: logFile, mkdir: true },
    });
  }

  if (targets.length > 0) {
    pinoOptions.transport = { targets };
  }

  rootLogger = pino(pinoOptions);
}

/**
 * Reconfigure existing loggers to inherit parent levels (hierarchical).
 *
 * Call after third-party libraries initialize their loggers.
 */
export function reconfigureExistingLoggers(): void {
  // In pino, child loggers inherit from parent.
  // This function exists for API compatibility.
  // Per-logger levels are applied in getLogger().
}

/**
 * Get a structured logger instance.
 *
 * @param name - Logger name (e.g., "my_config.config_base")
 * @returns Pino child logger instance
 */
export function getLogger(name: string): Logger {
  const childOptions: Record<string, unknown> = { name };

  // Apply per-logger level (hierarchical: "uvicorn" affects "uvicorn.error")
  const level = resolveLoggerLevel(name);
  if (level) {
    childOptions.level = level;
  }

  return rootLogger.child(childOptions);
}

function resolveLoggerLevel(name: string): string | undefined {
  // Exact match first
  if (loggerLevels[name]) return loggerLevels[name];

  // Hierarchical: check parent names
  const parts = name.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const parentName = parts.slice(0, i).join(".");
    if (loggerLevels[parentName]) return loggerLevels[parentName];
  }

  return undefined;
}
