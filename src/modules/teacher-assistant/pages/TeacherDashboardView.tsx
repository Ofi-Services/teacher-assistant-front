import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { TeacherDashboardResponse } from "@/modules/teacher-assistant/types"

export default function TeacherDashboardView() {
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
          {dashboard?.teacher && (
            <>
              <p className="text-sm text-muted-foreground">
                {dashboard.teacher.teacher_name} · Progreso promedio {dashboard.teacher.average_progress_percentage}%
              </p>
              <p className="text-sm text-muted-foreground">
                Asignaciones: {dashboard.teacher.total_assignments} · Alertas activas: {dashboard.teacher.active_alerts}
              </p>
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
