import { beforeEach, describe, expect, it } from "vitest";
import { _resetForTests, checkRateLimit } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetForTests();
  });

  it("allows the first 20 requests in a window", () => {
    const now = 0;
    for (let i = 1; i <= 20; i++) {
      const result = checkRateLimit("1.2.3.4", now);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 21st request in the same window with retryAfterSeconds 60", () => {
    const now = 0;
    for (let i = 1; i <= 20; i++) {
      checkRateLimit("1.2.3.4", now);
    }
    const result = checkRateLimit("1.2.3.4", now);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(60);
  });

  it("resets after the 60s window elapses", () => {
    for (let i = 1; i <= 20; i++) {
      checkRateLimit("1.2.3.4", 0);
    }
    expect(checkRateLimit("1.2.3.4", 0).allowed).toBe(false);
    expect(checkRateLimit("1.2.3.4", 60_001).allowed).toBe(true);
  });

  it("tracks separate IPs independently", () => {
    for (let i = 1; i <= 20; i++) {
      checkRateLimit("1.1.1.1", 0);
    }
    expect(checkRateLimit("1.1.1.1", 0).allowed).toBe(false);
    expect(checkRateLimit("2.2.2.2", 0).allowed).toBe(true);
  });
});
