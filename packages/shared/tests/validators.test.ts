import { describe, expect, it } from "vitest";
import { projectDraftSchema } from "../src/validators/project";

describe("project draft schema", () => {
  it("accepts valid draft payload", () => {
    const parsed = projectDraftSchema.parse({
      title: "Test",
      shortDescription: "Short",
      fullDescription: "Long description",
      tags: ["photo"],
      coverImagePath: "projects/test/cover.jpg",
      media: [{ type: "image", storagePath: "projects/test/1.jpg" }],
      featured: false,
      hidden: false,
    });

    expect(parsed.title).toBe("Test");
  });

  it("rejects empty cover path", () => {
    expect(() =>
      projectDraftSchema.parse({
        title: "Test",
        shortDescription: "Short",
        fullDescription: "Long description",
        tags: [],
        coverImagePath: "",
        media: [],
        featured: false,
        hidden: false,
      })
    ).toThrow();
  });
});
