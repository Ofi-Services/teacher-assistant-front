export type UserRole = "director" | "teacher"

export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: UserRole
}

export interface PlanModule {
  id?: number
  title: string
  description: string
  order: number
  expected_days: number
}

export interface TrainingPlan {
  id: number
  title: string
  description: string
  objectives: string
  duration_weeks: number
  created_by: number
  created_at: string
  updated_at: string
  modules: PlanModule[]
}

export type AssignmentStatus = "assigned" | "in_progress" | "completed"

export interface ProgressRecord {
  id: number
  module: number
  percent_completed: number
  notes: string
  evidence_url: string
  updated_at: string
}

export interface PlanAssignment {
  id: number
  plan: number
  teacher: number
  assigned_by: number
  status: AssignmentStatus
  progress_percentage: number
  assigned_at: string
  due_date: string | null
  last_activity_at: string | null
  progress_records?: ProgressRecord[]
}

export interface IntelligentAlert {
  id: number
  title: string
  message: string
  severity: "low" | "medium" | "high"
  is_resolved: boolean
  created_at: string
}

export interface AIRecommendation {
  id: number
  recommendation: string
  rationale: string
  context: Record<string, unknown>
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface DashboardPlan {
  assignment_id: number
  plan_id: number
  plan_title: string
  status: AssignmentStatus
  progress_percentage: number
  active_alerts: number
  last_activity_at: string | null
}

export interface DirectorDashboardTeacher {
  teacher_id: number
  teacher_name: string
  total_assignments: number
  average_progress_percentage: number
  active_alerts: number
  last_activity_at: string | null
  plans: DashboardPlan[]
}

export interface DirectorDashboardResponse {
  generated_at: string
  teachers: DirectorDashboardTeacher[]
}

export interface TeacherDashboardResponse {
  generated_at: string
  teacher: {
    teacher_id: number
    teacher_name: string
    total_assignments: number
    average_progress_percentage: number
    active_alerts: number
    last_activity_at: string | null
    plans: DashboardPlan[]
  }
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface ApiErrorPayload {
  detail?: string
  [key: string]: unknown
}
