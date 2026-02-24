import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/Input"
import { Label } from "@/shared/components/ui/label"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { PaginatedResponse, PlanAssignment } from "@/modules/teacher-assistant/types"

export default function AssignmentManagementView() {
  const [response, setResponse] = useState<PaginatedResponse<PlanAssignment> | null>(null)
  const [planOptions, setPlanOptions] = useState<Array<{ id: number; name: string }>>([])
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: number; name: string }>>([])
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [insightsMessage, setInsightsMessage] = useState("")

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
    teacher: "",
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
        setTeacherOptions(teachers)
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
      await teacherAssistantApi.createAssignment({
        plan: Number(newAssignment.plan),
        teacher: Number(newAssignment.teacher),
        due_date: newAssignment.due_date,
      })
      setNewAssignment({ plan: "", teacher: "", due_date: "" })
      await loadAssignments()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo crear la asignación")
    }
  }

  const generateInsights = async (assignmentId: number) => {
    try {
      setInsightsMessage("")
      const result = await teacherAssistantApi.generateInsights(assignmentId)
      setInsightsMessage(
        `Asignación ${assignmentId}: ${result.alerts_created.length} alertas y ${result.recommendations_created.length} recomendaciones generadas.`,
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron generar análisis")
    }
  }

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
              <Label htmlFor="assignment-teacher">Profesor</Label>
              <select
                id="assignment-teacher"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={newAssignment.teacher}
                onChange={(event) => setNewAssignment((prev) => ({ ...prev, teacher: event.target.value }))}
                required
              >
                <option value="">Seleccionar profesor</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={String(teacher.id)}>
                    {teacher.name}
                  </option>
                ))}
              </select>
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
      {insightsMessage && <p className="text-sm text-primary">{insightsMessage}</p>}

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
