import { describe, expect, it } from "vitest";
import type { Project } from "@/data/projects";
import { selectHeroSlides } from "@/components/sections/Hero/heroSlides";

const project = (overrides: Partial<Project>): Project => ({
  id: "id",
  slug: "project",
  title: "Project",
  shortDescription: "",
  fullDescription: "",
  tags: [],
  coverImage: "https://bucket/cover.jpg",
  media: [],
  date: "2026-01-01",
  featured: false,
  hidden: false,
  status: "published",
  sortOrder: 0,
  publishedAt: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  ...overrides,
});

describe("selectHeroSlides", () => {
  it("returns the first five unique cover images in project order", () => {
    const slides = selectHeroSlides([
      project({ id: "1", coverImage: "https://bucket/one.jpg" }),
      project({ id: "2", coverImage: "https://bucket/two.jpg" }),
      project({ id: "3", coverImage: "https://bucket/two.jpg" }),
      project({ id: "4", coverImage: "https://bucket/three.jpg" }),
      project({ id: "5", coverImage: "https://bucket/four.jpg" }),
      project({ id: "6", coverImage: "https://bucket/five.jpg" }),
      project({ id: "7", coverImage: "https://bucket/six.jpg" }),
    ]);

    expect(slides).toEqual([
      "https://bucket/one.jpg",
      "https://bucket/two.jpg",
      "https://bucket/three.jpg",
      "https://bucket/four.jpg",
      "https://bucket/five.jpg",
    ]);
  });
});
