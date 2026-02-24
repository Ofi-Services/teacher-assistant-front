import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { DirectorDashboardResponse } from "@/modules/teacher-assistant/types"

export default function DirectorDashboardView() {
  const [dashboard, setDashboard] = useState<DirectorDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await teacherAssistantApi.directorDashboard()
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
        <h1 className="text-2xl font-semibold">Panel del director</h1>
        <Button onClick={() => void loadDashboard()} disabled={loading}>
          Recargar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Seguimiento de progreso</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Cargando panel...</p>}
          {!loading && dashboard?.teachers.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin docentes con asignaciones todavía.</p>
          )}
          <div className="space-y-4">
            {dashboard?.teachers.map((teacher) => (
              <div key={teacher.teacher_id} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{teacher.teacher_name}</h3>
                  <p className="text-sm text-muted-foreground">Progreso promedio: {teacher.average_progress_percentage}%</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Asignaciones: {teacher.total_assignments} · Alertas activas: {teacher.active_alerts}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
