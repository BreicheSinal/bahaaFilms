import { describe, expect, it } from "vitest";
import { getGreetingDelay } from "@/components/intro/greetingPacing";

describe("getGreetingDelay", () => {
  it("holds the first multilingual greetings long enough to read", () => {
    expect(getGreetingDelay(0)).toBe(420);
    expect(getGreetingDelay(1)).toBe(600);
    expect(getGreetingDelay(2)).toBe(520);
  });

  it("leaves 300ms for rapid cuts before the normal logo reveal", () => {
    const readableDurationMs = Array.from({ length: 6 }, (_, index) => getGreetingDelay(index))
      .reduce((total, delay) => total + delay, 0);

    expect(readableDurationMs).toBe(4300);
    expect(getGreetingDelay(5)).toBe(1970);
    expect(getGreetingDelay(6)).toBe(10);
  });
});
