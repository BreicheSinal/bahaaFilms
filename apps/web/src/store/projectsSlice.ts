import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ProjectsState = {
  searchQuery: string;
  selectedTag: string;
};

const initialState: ProjectsState = {
  searchQuery: "",
  selectedTag: "All",
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedTag(state, action: PayloadAction<string>) {
      state.selectedTag = action.payload;
    },
    resetFilters(state) {
      state.searchQuery = "";
      state.selectedTag = "All";
    },
  },
});

export const { setSearchQuery, setSelectedTag, resetFilters } =
  projectsSlice.actions;

export default projectsSlice.reducer;
