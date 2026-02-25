import {
  AIRecommendation,
  DirectorDashboardResponse,
  IntelligentAlert,
  LoginResponse,
  PaginatedResponse,
  PlanAssignment,
  ProgressRecord,
  TeacherDashboardResponse,
  TrainingPlan,
  User,
} from "@/modules/teacher-assistant/types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"
const ACCESS_TOKEN_KEY = "ta_access_token"
const REFRESH_TOKEN_KEY = "ta_refresh_token"

type RequestMethod = "GET" | "POST" | "PATCH"

class ApiHttpError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = "ApiHttpError"
    this.status = status
    this.data = data
  }
}

const buildUrl = (path: string, query?: Record<string, string | number | boolean | undefined>) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const parseResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return response.json()
  }

  return null
}

const refreshAccessToken = async () => {
  const refresh = getRefreshToken()
  if (!refresh) {
    return null
  }

  const response = await fetch(buildUrl("/api/auth/token/refresh/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) {
    clearTokens()
    return null
  }

  const data = (await response.json()) as { access: string }
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
  return data.access
}

async function request<T>(
  path: string,
  method: RequestMethod,
  options?: {
    body?: unknown | FormData
    auth?: boolean
    query?: Record<string, string | number | boolean | undefined>
    retried?: boolean
  },
): Promise<T> {
  const { body, auth = true, query, retried = false } = options ?? {}
  const token = getAccessToken()
  const isFormDataBody = body instanceof FormData

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isFormDataBody ? body : JSON.stringify(body)) : undefined,
  })

  if (response.status === 401 && auth && !retried) {
    const nextToken = await refreshAccessToken()
    if (nextToken) {
      return request<T>(path, method, { ...options, retried: true })
    }
  }

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiHttpError((data as { detail?: string })?.detail ?? "Request failed", response.status, data)
  }

  return data as T
}

export const teacherAssistantApi = {
  ApiHttpError,
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/auth/token/", "POST", {
      auth: false,
      body: { username, password },
    }),

  getProfile: () => request<User>("/api/accounts/profile/me/", "GET"),

  getPlan: (planId: number) =>
    request<TrainingPlan>(`/api/training/plans/${planId}/`, "GET"),

  listPlans: (query?: { search?: string; ordering?: string; created_by?: number; page?: number }) =>
    request<PaginatedResponse<TrainingPlan>>("/api/training/plans/", "GET", { query }),

  createPlan: (payload: {
    title: string
    description: string
    objectives: string
    duration_weeks: number
    modules: Array<{
      title: string
      description: string
      order: number
      expected_days: number
    }>
  }) => request<TrainingPlan>("/api/training/plans/", "POST", { body: payload }),

  updatePlan: (planId: number, payload: Partial<Omit<TrainingPlan, "id" | "created_at" | "updated_at">>) =>
    request<TrainingPlan>(`/api/training/plans/${planId}/`, "PATCH", { body: payload }),

  listAssignments: (query?: {
    status?: string
    teacher?: number
    plan?: number
    search?: string
    ordering?: string
    page?: number
  }) => request<PaginatedResponse<PlanAssignment>>("/api/assignments/", "GET", { query }),

  createAssignment: (payload: { plan: number; teacher: number; due_date: string }) =>
    request<PlanAssignment>("/api/assignments/", "POST", { body: payload }),

  getMyAssignments: (query?: { page?: number }) =>
    request<PaginatedResponse<PlanAssignment>>("/api/assignments/me/", "GET", { query }),

  updateProgress: (
    assignmentId: number,
    payload: {
      module: number
      percent_completed: number
      notes: string
      evidence_url?: string
      evidence_file?: File | null
    },
  ) => {
    if (payload.evidence_file) {
      const formData = new FormData()
      formData.append("module", String(payload.module))
      formData.append("percent_completed", String(payload.percent_completed))
      formData.append("notes", payload.notes)

      if (payload.evidence_url && payload.evidence_url.trim() !== "") {
        formData.append("evidence_url", payload.evidence_url)
      }

      formData.append("evidence_file", payload.evidence_file)

      return request<ProgressRecord>(`/api/assignments/${assignmentId}/progress/`, "PATCH", { body: formData })
    }

    return request<ProgressRecord>(`/api/assignments/${assignmentId}/progress/`, "PATCH", {
      body: {
        module: payload.module,
        percent_completed: payload.percent_completed,
        notes: payload.notes,
        evidence_url: payload.evidence_url ?? "",
      },
    })
  },

  directorDashboard: () =>
    request<DirectorDashboardResponse>("/api/assignments/dashboard/director/", "GET"),

  teacherDashboard: () =>
    request<TeacherDashboardResponse>("/api/assignments/dashboard/me/", "GET"),

  generateInsights: (assignmentId: number) =>
    request<{
      alerts_created: IntelligentAlert[]
      recommendations_created: AIRecommendation[]
    }>(`/api/insights/alerts/generate/${assignmentId}/`, "POST"),

  listAlerts: (query?: { severity?: string; is_resolved?: boolean; assignment?: number; page?: number }) =>
    request<PaginatedResponse<IntelligentAlert>>("/api/insights/alerts/", "GET", { query }),

  listRecommendations: (query?: { assignment?: number; page?: number }) =>
    request<PaginatedResponse<AIRecommendation>>("/api/insights/recommendations/", "GET", { query }),
}
