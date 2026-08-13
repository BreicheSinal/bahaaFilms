import { describe, expect, it } from "vitest";
import type { Project } from "@/data/projects";
import {
  getClientProjectsHref,
  selectUniqueClients,
} from "@/components/sections/Clients/clientProjects";

const project = (overrides: Partial<Project>): Project => ({
  id: "id",
  slug: "client",
  title: "Client",
  shortDescription: "",
  fullDescription: "",
  tags: [],
  coverImage: "https://bucket/cover.png",
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

describe("selectUniqueClients", () => {
  it("keeps the first logo-bearing project for each normalized title", () => {
    const clients = selectUniqueClients([
      project({ id: "1", title: "Acme", logo: "https://bucket/acme.png" }),
      project({ id: "2", title: " acme ", logo: "https://bucket/new-acme.png" }),
      project({ id: "3", title: "Beacon", logo: "https://bucket/beacon.png" }),
    ]);

    expect(clients.map(({ id }) => id)).toEqual(["1", "3"]);
  });

  it("excludes projects without a title or resolved logo", () => {
    const clients = selectUniqueClients([
      project({ id: "1", title: "", logo: "https://bucket/empty-title.png" }),
      project({ id: "2", title: "No logo" }),
      project({ id: "3", title: "Shown", logo: "https://bucket/shown.png" }),
    ]);

    expect(clients.map(({ id }) => id)).toEqual(["3"]);
  });

  it("excludes projects whose logo value is only whitespace", () => {
    const clients = selectUniqueClients([
      project({ id: "1", title: "Blank logo", logo: "   " }),
      project({ id: "2", title: "Shown", logo: "https://bucket/shown.png" }),
    ]);

    expect(clients.map(({ id }) => id)).toEqual(["2"]);
  });

  it("keeps one client when separate projects share the same logo", () => {
    const clients = selectUniqueClients([
      project({ id: "1", title: "First client", logo: "https://bucket/shared-logo.png" }),
      project({ id: "2", title: "Second client", logo: "https://bucket/shared-logo.png" }),
    ]);

    expect(clients.map(({ id }) => id)).toEqual(["1"]);
  });

  it("creates a projects URL with the client's first tag selected", () => {
    expect(
      getClientProjectsHref(
        project({
          slug: "acme",
          tags: ["Commercial Work", "Film"],
          logo: "https://bucket/acme.png",
        })
      )
    ).toBe("/projects?tag=Commercial%20Work&client=https%3A%2F%2Fbucket%2Facme.png");
  });
});
