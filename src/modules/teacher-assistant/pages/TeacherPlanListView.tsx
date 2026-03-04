import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { PaginatedResponse, PlanAssignment } from "@/modules/teacher-assistant/types"

export default function TeacherPlanListView() {
  const PAGE_SIZE = 8
  const [response, setResponse] = useState<PaginatedResponse<PlanAssignment> | null>(null)
  const [planTitles, setPlanTitles] = useState<Record<number, string>>({})
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getStatusLabel = (statusValue: PlanAssignment["status"]) => {
    if (statusValue === "assigned") {
      return "Asignado"
    }
    if (statusValue === "in_progress") {
      return "En progreso"
    }
    return "Completado"
  }

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await teacherAssistantApi.getMyAssignments({ page, page_size: PAGE_SIZE })
      setResponse(data)

      const plansResponse = await teacherAssistantApi.listPlans({ page: 1 })
      setPlanTitles(
        plansResponse.results.reduce<Record<number, string>>((accumulator, plan) => {
          accumulator[plan.id] = plan.title
          return accumulator
        }, {}),
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar tus planes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAssignments()
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis planes asignados</h1>
        <Button variant="outline" onClick={() => void loadAssignments()} disabled={loading}>
          Refrescar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Listado de asignaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {response?.results.map((assignment) => (
            <div key={assignment.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{assignment.plan_title?.trim() || planTitles[assignment.plan] || `Asignación #${assignment.id}`}</p>
                <p className="text-sm text-muted-foreground">Estado: {getStatusLabel(assignment.status)}</p>
                <p className="text-sm text-muted-foreground">Progreso: {assignment.progress_percentage}%</p>
              </div>
              <Button asChild>
                <Link to={`/teacher/assignments/${assignment.id}`}>Abrir detalle</Link>
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((prev) => prev - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page}</span>
            <Button variant="outline" disabled={!response?.next || loading} onClick={() => setPage((prev) => prev + 1)}>
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
