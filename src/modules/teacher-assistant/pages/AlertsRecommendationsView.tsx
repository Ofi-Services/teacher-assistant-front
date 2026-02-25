import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { IntelligentAlert, PaginatedResponse } from "@/modules/teacher-assistant/types"

export default function AlertsRecommendationsView() {
  const [severity, setSeverity] = useState("")
  const [alertsPage, setAlertsPage] = useState(1)
  const [alerts, setAlerts] = useState<PaginatedResponse<IntelligentAlert> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getSeverityLabel = (severityValue: "low" | "medium" | "high") => {
    if (severityValue === "low") {
      return "Baja"
    }
    if (severityValue === "medium") {
      return "Media"
    }
    return "Alta"
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const alertsData = await teacherAssistantApi.listAlerts({ severity: severity || undefined, page: alertsPage })
      setAlerts(alertsData)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cargar análisis")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [alertsPage])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Alertas</h1>

      <div className="flex items-center gap-2">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
        >
          <option value="">Todas las severidades</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
        <Button onClick={() => void loadData()} disabled={loading}>
          Aplicar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Alertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Cargando alertas...</p>}
          {alerts?.results.map((alert) => (
            <div key={alert.id} className="rounded-md border border-border p-3">
              <p className="font-medium">{alert.title}</p>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {alert.teacher_name} · {alert.plan_name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getSeverityLabel(alert.severity)} · {alert.is_resolved ? "Resuelta" : "Abierta"}
              </p>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              disabled={alertsPage <= 1 || loading}
              onClick={() => setAlertsPage((prev) => prev - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {alertsPage}</span>
            <Button
              variant="outline"
              disabled={!alerts?.next || loading}
              onClick={() => setAlertsPage((prev) => prev + 1)}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
