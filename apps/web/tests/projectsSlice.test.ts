import { describe, expect, it } from "vitest";
import reducer, {
  resetFilters,
  setSearchQuery,
  setSelectedTag,
} from "@/store/projectsSlice";

describe("projects filter state", () => {
  it("resets both filters without retaining remote project data", () => {
    let state = reducer(undefined, setSearchQuery("portrait"));
    state = reducer(state, setSelectedTag("Editorial"));
    state = reducer(state, resetFilters());

    expect(state).toEqual({ searchQuery: "", selectedTag: "All" });
  });
});
