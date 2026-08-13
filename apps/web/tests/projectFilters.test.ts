import { describe, expect, it } from "vitest";
import { matchesSelectedTag } from "@/lib/projectFilters";

describe("matchesSelectedTag", () => {
  it("matches a selected tag despite casing and surrounding whitespace", () => {
    expect(matchesSelectedTag([" Commercial Work "], "commercial work")).toBe(true);
  });

  it("keeps the All selection unfiltered", () => {
    expect(matchesSelectedTag([], "All")).toBe(true);
  });
});
