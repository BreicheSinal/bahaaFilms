import { describe, expect, it } from "vitest";
import { slugify, buildUniqueSlug } from "../src/utils/slug";

describe("slug utils", () => {
  it("slugifies safely", () => {
    expect(slugify(" My Portfolio Project! ")).toBe("my-portfolio-project");
  });

  it("builds unique suffixes", () => {
    const taken = new Set(["project", "project-2"]);
    expect(buildUniqueSlug("project", taken)).toBe("project-3");
  });
});
