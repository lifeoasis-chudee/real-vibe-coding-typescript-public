import { describe, expect, it } from "vitest";
import { getLogger } from "../src/index.js";

describe("Logger", () => {
  it("should return a logger instance with standard methods", () => {
    const logger = getLogger("test");

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should create loggers with different names", () => {
    const logger1 = getLogger("test.module1");
    const logger2 = getLogger("test.module2");

    expect(logger1).toBeDefined();
    expect(logger2).toBeDefined();
  });

  it("should log a message without error", () => {
    const logger = getLogger("test.logging");

    expect(() => {
      logger.info({ extraField: "value" }, "test message");
    }).not.toThrow();
  });
});
