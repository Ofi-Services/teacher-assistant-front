import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { TeacherDashboardResponse } from "@/modules/teacher-assistant/types"

export default function TeacherDashboardView() {
  const teacherKpis = {
    averageProgress: "75.69%",
    assignments: 12,
    activeAlerts: 2,
  }

  const [dashboard, setDashboard] = useState<TeacherDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getStatusLabel = (statusValue: "assigned" | "in_progress" | "completed") => {
    if (statusValue === "assigned") {
      return "Asignado"
    }
    if (statusValue === "in_progress") {
      return "En progreso"
    }
    return "Completado"
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await teacherAssistantApi.teacherDashboard()
      setDashboard(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cargar el panel")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panel del docente</h1>
        <Button onClick={() => void loadDashboard()} disabled={loading}>
          Recargar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Resumen personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Cargando información...</p>}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border p-3">
              <p className="text-sm text-muted-foreground">Progreso promedio: </p>
              <p className="text-2xl font-semibold">{teacherKpis.averageProgress}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-sm text-muted-foreground">Asignaciones</p>
              <p className="text-2xl font-semibold">{teacherKpis.assignments}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-sm text-muted-foreground">Alertas activas</p>
              <p className="text-2xl font-semibold">{teacherKpis.activeAlerts}</p>
            </div>
          </div>
          {dashboard?.teacher && (
            <>
              <div className="space-y-2">
                {dashboard.teacher.plans.map((plan) => (
                  <div key={plan.assignment_id} className="rounded-md border border-border p-3">
                    <p className="font-medium">{plan.plan_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Estado: {getStatusLabel(plan.status)} · Progreso: {plan.progress_percentage}%
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
