import { describe, expect, it } from "vitest";
import { getGreetingDelay } from "@/components/intro/greetingPacing";

describe("getGreetingDelay", () => {
  it("holds the first multilingual greetings long enough to read", () => {
    expect(getGreetingDelay(0)).toBe(850);
    expect(getGreetingDelay(1)).toBe(760);
    expect(getGreetingDelay(2)).toBe(680);
  });

  it("speeds up only toward the end of the sequence", () => {
    expect(getGreetingDelay(5)).toBe(450);
    expect(getGreetingDelay(6)).toBe(350);
  });
});
