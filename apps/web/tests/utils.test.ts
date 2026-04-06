import { describe, expect, it } from "vitest";
import { cn } from "../src/components/ui/utils";

describe("cn", () => {
  it("joins classes from mixed inputs", () => {
    expect(cn("base", ["extra"], { active: true, hidden: false })).toBe(
      "base extra active"
    );
  });

  it("resolves tailwind conflicts by keeping the latest class", () => {
    expect(cn("p-2", "p-4", "text-sm", "text-lg")).toBe("p-4 text-lg");
  });
});
