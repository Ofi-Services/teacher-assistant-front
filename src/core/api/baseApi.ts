
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"

// Base API with automatic authentication
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    "Courses",
    "UserProgress", 
    "TeamMembers",
    "TeamProgress",
    "Users",
    "SystemStats",
    "Certificates",
  ],
  endpoints: () => ({}),
})