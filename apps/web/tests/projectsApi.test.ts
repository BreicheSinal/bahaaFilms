import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProjects } = vi.hoisted(() => ({ getProjects: vi.fn() }));

vi.mock("@/data/projects", () => ({ getProjects }));

import { projectsApi } from "@/store/projectsApi";

function createTestStore() {
  return configureStore({
    reducer: { [projectsApi.reducerPath]: projectsApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(projectsApi.middleware),
  });
}

describe("projectsApi", () => {
  beforeEach(() => getProjects.mockReset());

  it("shares one request between concurrent subscribers and caches an empty list", async () => {
    getProjects.mockResolvedValue([]);
    const store = createTestStore();
    const first = store.dispatch(projectsApi.endpoints.getProjects.initiate());
    const second = store.dispatch(projectsApi.endpoints.getProjects.initiate());

    await Promise.all([first.unwrap(), second.unwrap()]);

    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(projectsApi.endpoints.getProjects.select()(store.getState()).data).toEqual([]);
  });
});
