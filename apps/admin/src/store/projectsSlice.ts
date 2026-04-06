import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type AdminProject = {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  tags?: string[];
  logoPath?: string;
  coverImagePath?: string;
  featured: boolean;
  hidden: boolean;
  sortOrder: number;
  status: "draft" | "published";
  links?: {
    facebook?: string;
    instagram?: string;
    behance?: string;
  };
  media?: Array<{
    type: "image" | "video";
    storagePath: string;
    thumbnailPath?: string;
  }>;
  updatedAt?: string;
};

type ProjectsState = {
  projects: AdminProject[];
  byId: Record<string, AdminProject>;
  listStatus: "idle" | "loading" | "succeeded" | "failed";
  detailsStatusById: Record<string, "idle" | "loading" | "succeeded" | "failed">;
  error: string | null;
  loadedAt: number | null;
};

const initialState: ProjectsState = {
  projects: [],
  byId: {},
  listStatus: "idle",
  detailsStatusById: {},
  error: null,
  loadedAt: null,
};

function indexById(items: AdminProject[]) {
  return items.reduce<Record<string, AdminProject>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

export const fetchProjects = createAsyncThunk<
  AdminProject[],
  { force?: boolean } | undefined,
  { state: { projects: ProjectsState } }
>("projects/fetchProjects", async () => {
  const response = await fetch("/api/projects");
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to load projects");
  }
  return (payload.projects || []) as AdminProject[];
}, {
  condition: (arg, { getState }) => {
    const force = Boolean(arg?.force);
    const { loadedAt, listStatus } = getState().projects;
    if (force) return true;
    if (listStatus === "loading") return false;
    return loadedAt === null;
  },
});

export const fetchProjectById = createAsyncThunk<
  AdminProject,
  { id: string; force?: boolean },
  { state: { projects: ProjectsState } }
>("projects/fetchProjectById", async ({ id }) => {
  const response = await fetch(`/api/projects/${id}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to load project");
  }
  return payload.project as AdminProject;
}, {
  condition: ({ id, force }, { getState }) => {
    if (force) return true;
    const state = getState().projects;
    if (state.detailsStatusById[id] === "loading") return false;
    return !state.byId[id];
  },
});

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    upsertProject(state, action: { payload: AdminProject }) {
      const project = action.payload;
      state.byId[project.id] = project;
      const existingIndex = state.projects.findIndex((item) => item.id === project.id);
      if (existingIndex >= 0) {
        state.projects[existingIndex] = project;
      } else {
        state.projects.unshift(project);
      }
    },
    setProjects(state, action: { payload: AdminProject[] }) {
      state.projects = action.payload;
      state.byId = indexById(action.payload);
      state.loadedAt = Date.now();
      state.listStatus = "succeeded";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.listStatus = "loading";
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.byId = indexById(action.payload);
        state.listStatus = "succeeded";
        state.loadedAt = Date.now();
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.listStatus = "failed";
        state.error = action.error.message || "Failed to load projects";
      })
      .addCase(fetchProjectById.pending, (state, action) => {
        state.detailsStatusById[action.meta.arg.id] = "loading";
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        const project = action.payload;
        state.byId[project.id] = project;
        state.detailsStatusById[project.id] = "succeeded";
        const existingIndex = state.projects.findIndex((item) => item.id === project.id);
        if (existingIndex >= 0) {
          state.projects[existingIndex] = project;
        } else {
          state.projects.push(project);
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.detailsStatusById[action.meta.arg.id] = "failed";
        state.error = action.error.message || "Failed to load project";
      });
  },
});

export const { upsertProject, setProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
