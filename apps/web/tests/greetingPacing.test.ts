import { describe, expect, it } from "vitest";
import { getGreetingDelay } from "@/components/intro/greetingPacing";

describe("getGreetingDelay", () => {
  it("holds the first multilingual greetings long enough to read", () => {
    expect(getGreetingDelay(0)).toBe(800);
    expect(getGreetingDelay(1)).toBe(700);
    expect(getGreetingDelay(2)).toBe(600);
  });

  it("speeds up only toward the end of the sequence", () => {
    expect(getGreetingDelay(5)).toBe(300);
    expect(getGreetingDelay(6)).toBe(55);
  });
});
