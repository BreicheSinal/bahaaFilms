import { configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./projectsSlice";
import { projectsApi } from "./projectsApi";

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(projectsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
