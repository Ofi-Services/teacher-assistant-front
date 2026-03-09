import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/Input"
import { Label } from "@/shared/components/ui/label"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { PaginatedResponse, PlanAssignment } from "@/modules/teacher-assistant/types"

type AssignmentInsights = {
  assignmentId: number
  generatedAt: string
  alerts: Array<{
    id: number
    title: string
    message: string
    severity: "low" | "medium" | "high"
    is_resolved: boolean
    teacher_name: string
    plan_name: string
    created_at: string
  }>
  recommendations: Array<{
    id: number
    recommendation: string
    rationale: string
    context: Record<string, unknown>
    created_at: string
  }>
}

export default function AssignmentManagementView() {
  const EXTRA_TEACHER_NAMES = [
    "Laura Martínez",
    "Carlos Gómez",
    "Ana Rodríguez",
    "Javier Torres",
    "Mariana López",
    "Diego Fernández",
    "Sofía Herrera",
    "Ricardo Vega",
    "Valentina Castro",
    "Pablo Morales",
  ]

  const [response, setResponse] = useState<PaginatedResponse<PlanAssignment> | null>(null)
  const [planOptions, setPlanOptions] = useState<Array<{ id: number; name: string }>>([])
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: number; name: string }>>([])
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [insights, setInsights] = useState<AssignmentInsights | null>(null)

  const getStatusLabel = (statusValue: PlanAssignment["status"]) => {
    if (statusValue === "assigned") {
      return "Asignado"
    }
    if (statusValue === "in_progress") {
      return "En progreso"
    }
    return "Completado"
  }

  const [newAssignment, setNewAssignment] = useState({
    plan: "",
    teachers: [] as string[],
    due_date: "",
  })

  const loadFormOptions = async () => {
    try {
      const [plansResult, dashboardResult, assignmentsResult] = await Promise.allSettled([
        teacherAssistantApi.listPlans({ page: 1 }),
        teacherAssistantApi.directorDashboard(),
        teacherAssistantApi.listAssignments({ page: 1 }),
      ])

      if (plansResult.status === "fulfilled") {
        setPlanOptions(
          plansResult.value.results.map((plan) => ({
            id: plan.id,
            name: plan.title,
          })),
        )
      }

      if (dashboardResult.status === "fulfilled") {
        const teachers = dashboardResult.value.teachers.map((teacher) => ({
          id: teacher.teacher_id,
          name: teacher.teacher_name,
        }))

        const maxTeacherId = teachers.reduce((currentMax, teacher) => Math.max(currentMax, teacher.id), 0)

        const mockTeachers = EXTRA_TEACHER_NAMES.map((name, index) => ({
          id: maxTeacherId + index + 1,
          name,
        }))

        setTeacherOptions([...teachers, ...mockTeachers])
      }

      if (dashboardResult.status !== "fulfilled" && assignmentsResult.status === "fulfilled") {
        const uniqueTeacherIds = [...new Set(assignmentsResult.value.results.map((assignment) => assignment.teacher))]
        setTeacherOptions(
          uniqueTeacherIds.map((teacherId) => ({
            id: teacherId,
            name: `Profesor #${teacherId}`,
          })),
        )
      }
    } catch {
      setPlanOptions([])
      setTeacherOptions([])
    }
  }

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await teacherAssistantApi.listAssignments({
        page,
        status: status || undefined,
        search: search || undefined,
      })
      setResponse(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar asignaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAssignments()
  }, [page])

  useEffect(() => {
    void loadFormOptions()
  }, [])

  const createAssignment = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setError("")
      if (newAssignment.teachers.length === 0) {
        setError("Selecciona al menos un profesor")
        return
      }

      await Promise.all(
        newAssignment.teachers.map((teacherId) =>
          teacherAssistantApi.createAssignment({
            plan: Number(newAssignment.plan),
            teacher: Number(teacherId),
            due_date: newAssignment.due_date,
          }),
        ),
      )
      setNewAssignment({ plan: "", teachers: [], due_date: "" })
      await loadAssignments()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo crear la asignación")
    }
  }

  const generateInsights = async (assignmentId: number) => {
    try {
      setError("")
      setInsights(null)
      const result = await teacherAssistantApi.generateInsights(assignmentId)
      setInsights({
        assignmentId,
        generatedAt: new Date().toISOString(),
        alerts: result.alerts_created,
        recommendations: result.recommendations_created,
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron generar análisis")
    }
  }

  const severityBreakdown = insights?.alerts.reduce(
    (accumulator, alert) => {
      if (alert.severity === "high") {
        return { ...accumulator, high: accumulator.high + 1 }
      }
      if (alert.severity === "medium") {
        return { ...accumulator, medium: accumulator.medium + 1 }
      }
      return { ...accumulator, low: accumulator.low + 1 }
    },
    { high: 0, medium: 0, low: 0 },
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Gestión de asignaciones</h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={createAssignment}>
            <div>
              <Label htmlFor="assignment-plan">Plan</Label>
              <select
                id="assignment-plan"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={newAssignment.plan}
                onChange={(event) => setNewAssignment((prev) => ({ ...prev, plan: event.target.value }))}
                required
              >
                <option value="">Seleccionar plan</option>
                {planOptions.map((plan) => (
                  <option key={plan.id} value={String(plan.id)}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Profesores</Label>
              <div className="max-h-32 w-full overflow-y-auto rounded-md border border-input bg-background px-3 py-2">
                {teacherOptions.map((teacher) => (
                  <label key={teacher.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      value={String(teacher.id)}
                      checked={newAssignment.teachers.includes(String(teacher.id))}
                      onChange={(event) => {
                        const teacherId = event.target.value
                        setNewAssignment((prev) => ({
                          ...prev,
                          teachers: event.target.checked
                            ? [...prev.teachers, teacherId]
                            : prev.teachers.filter((value) => value !== teacherId),
                        }))
                      }}
                    />
                    <span>{teacher.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="assignment-date">Fecha límite</Label>
              <Input
                id="assignment-date"
                type="date"
                value={newAssignment.due_date}
                onChange={(event) => setNewAssignment((prev) => ({ ...prev, due_date: event.target.value }))}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Crear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input value={search} placeholder="Buscar" onChange={(event) => setSearch(event.target.value)} />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="assigned">Asignado</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completado</option>
          </select>
          <Button onClick={() => void loadAssignments()} disabled={loading}>
            Aplicar filtros
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis profundo · Asignación #{insights.assignmentId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border p-3">
              <p className="text-sm font-medium">Resumen ejecutivo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Se generaron {insights.alerts.length} alertas y {insights.recommendations.length} recomendaciones.
                {" "}
                Distribución por severidad: {severityBreakdown?.high ?? 0} alta, {severityBreakdown?.medium ?? 0} media,
                {" "}
                {severityBreakdown?.low ?? 0} baja.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Alertas clave</p>
              {insights.alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">No se generaron alertas para esta asignación.</p>
              )}
              {insights.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Severidad: {alert.severity} · {alert.teacher_name} · {alert.plan_name}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Recomendaciones priorizadas</p>
              {insights.recommendations.length === 0 && (
                <p className="text-sm text-muted-foreground">No se generaron recomendaciones para esta asignación.</p>
              )}
              {insights.recommendations.slice(0, 5).map((recommendation) => (
                <div key={recommendation.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">{recommendation.recommendation}</p>
                  <p className="text-sm text-muted-foreground mt-1">{recommendation.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {response?.results.map((assignment) => (
          <Card key={assignment.id}>
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {assignment.plan_title?.trim()
                    || planOptions.find((plan) => plan.id === assignment.plan)?.name
                    || `Asignación #${assignment.id}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Plan {assignment.plan_title?.trim() || planOptions.find((plan) => plan.id === assignment.plan)?.name || assignment.plan}
                  {" · "}
                  Profesor {teacherOptions.find((teacher) => teacher.id === assignment.teacher)?.name || assignment.teacher} · {getStatusLabel(assignment.status)}
                </p>
                <p className="text-sm text-muted-foreground">Progreso {assignment.progress_percentage}%</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to={`/teacher/assignments/${assignment.id}`}>Ver detalle</Link>
                </Button>
                <Button onClick={() => void generateInsights(assignment.id)}>Generar análisis</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((prev) => prev - 1)}>
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Página {page}</span>
        <Button variant="outline" disabled={!response?.next || loading} onClick={() => setPage((prev) => prev + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}
