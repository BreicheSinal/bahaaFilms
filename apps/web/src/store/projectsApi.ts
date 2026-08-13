import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getProjects, type Project } from "@/data/projects";

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fakeBaseQuery(),
  keepUnusedDataFor: 600,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      async queryFn() {
        try {
          return { data: await getProjects() };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : String(error),
            },
          };
        }
      },
    }),
  }),
});

export const { useGetProjectsQuery } = projectsApi;
