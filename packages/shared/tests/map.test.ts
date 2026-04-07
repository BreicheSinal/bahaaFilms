import { describe, expect, it } from "vitest";
import { mapProjectDocForPublic } from "../src/firestore/map";
import type { ProjectDoc } from "../src/types/project";

describe("mapProjectDocForPublic", () => {
  it("resolves media source urls", async () => {
    const doc: ProjectDoc = {
      slug: "solar",
      title: "Solar",
      shortDescription: "Short",
      fullDescription: "Long",
      tags: [],
      coverImagePath: "CoverImage/solar/cover.jpg",
      media: [
        {
          type: "video",
          storagePath: "projects/solar/main.m4v",
          sources: [
            { url: "projects/solar/main.m4v", type: "video/mp4" },
            { url: "projects/solar/main.webm", type: "video/webm" },
          ],
        },
      ],
      status: "published",
      featured: false,
      hidden: false,
      sortOrder: 0,
      publishedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const mapped = await mapProjectDocForPublic("1", doc, async (path) =>
      path ? `https://cdn.example.com/${encodeURIComponent(path)}` : undefined
    );

    expect(mapped.mediaResolved[0]?.url).toBe(
      "https://cdn.example.com/projects%2Fsolar%2Fmain.m4v"
    );
    expect(mapped.mediaResolved[0]?.sources?.[0]?.url).toBe(
      "https://cdn.example.com/projects%2Fsolar%2Fmain.m4v"
    );
    expect(mapped.mediaResolved[0]?.sources?.[1]?.url).toBe(
      "https://cdn.example.com/projects%2Fsolar%2Fmain.webm"
    );
  });
});
