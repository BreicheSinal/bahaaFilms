import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { getProjects, type Project } from "@/data/projects";

type ProjectsState = {
  items: Project[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedTag: string;
  selectedClientLogo: string | null;
};

const initialState: ProjectsState = {
  items: [],
  loading: false,
  error: null,
  searchQuery: "",
  selectedTag: "All",
  selectedClientLogo: null,
};

export const fetchProjects = createAsyncThunk("projects/fetch", async () => {
  return getProjects();
});

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedTag(state, action: PayloadAction<string>) {
      state.selectedTag = action.payload;
      state.selectedClientLogo = null;
    },
    setSelectedClient(state, action: PayloadAction<{ title: string; logo: string }>) {
      state.selectedTag = action.payload.title;
      state.selectedClientLogo = action.payload.logo;
    },
    resetFilters(state) {
      state.searchQuery = "";
      state.selectedTag = "All";
      state.selectedClientLogo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load projects";
      });
  },
});

export const { setSearchQuery, setSelectedTag, setSelectedClient, resetFilters } =
  projectsSlice.actions;

export default projectsSlice.reducer;
