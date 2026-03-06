import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { IntelligentAlert, PaginatedResponse } from "@/modules/teacher-assistant/types"

export default function AlertsRecommendationsView() {
  const EXTRA_ALERTS_COUNT = 10
  const [severity, setSeverity] = useState("")
  const [alertsPage, setAlertsPage] = useState(1)
  const [alerts, setAlerts] = useState<PaginatedResponse<IntelligentAlert> | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingAlertId, setSendingAlertId] = useState<number | null>(null)
  const [alertNotificationMessages, setAlertNotificationMessages] = useState<Record<number, string>>({})
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

  const generateExtraAlerts = (filterSeverity: string) => {
    const severities: Array<IntelligentAlert["severity"]> = ["low", "medium", "high"]
    const teacherNames = [
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
    const improvementPlans = [
      "Plan de mejora en evaluación formativa",
      "Plan de mejora en metodologías activas",
      "Plan de mejora en gestión de aula",
      "Plan de mejora en inclusión educativa",
      "Plan de mejora en aprendizaje basado en proyectos",
      "Plan de mejora en retroalimentación efectiva",
      "Plan de mejora en integración de TIC",
      "Plan de mejora en seguimiento académico",
      "Plan de mejora en diseño instruccional",
      "Plan de mejora en innovación pedagógica",
    ]

    const generatedAlerts: IntelligentAlert[] = Array.from({ length: EXTRA_ALERTS_COUNT }, (_, index) => {
      const severityValue = severities[index % severities.length]
      const teacherName = teacherNames[index % teacherNames.length]
      const planName = improvementPlans[index % improvementPlans.length]

      return {
        id: -(alertsPage * 100 + index + 1),
        title: `Seguimiento requerido - ${teacherName}`,
        message: `Se detectó una posible desviación en el avance del ${planName}.`,
        severity: severityValue,
        is_resolved: false,
        teacher_name: teacherName,
        plan_name: planName,
        created_at: new Date().toISOString(),
      }
    })

    if (!filterSeverity) {
      return generatedAlerts
    }

    return generatedAlerts.filter((alert) => alert.severity === filterSeverity)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const alertsData = await teacherAssistantApi.listAlerts({ severity: severity || undefined, page: alertsPage })
      const extraAlerts = generateExtraAlerts(severity)
      setAlerts({
        ...alertsData,
        count: alertsData.count + extraAlerts.length,
        results: [...alertsData.results, ...extraAlerts],
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cargar análisis")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [alertsPage])

  const sendAlertNotification = async (alertId: number) => {
    if (alertId < 0) {
      setAlertNotificationMessages((prev) => ({
        ...prev,
        [alertId]: "Alerta demo: no se envía notificación al backend.",
      }))
      return
    }

    try {
      setSendingAlertId(alertId)
      setAlertNotificationMessages((prev) => ({ ...prev, [alertId]: "" }))
      await teacherAssistantApi.sendAlertToSlack(alertId)
      setAlertNotificationMessages((prev) => ({
        ...prev,
        [alertId]: "Notificación enviada a Slack",
      }))
    } catch (requestError) {
      const isSlackEndpointMissing =
        requestError instanceof teacherAssistantApi.ApiHttpError && requestError.status === 404

      setAlertNotificationMessages((prev) => ({
        ...prev,
        [alertId]: isSlackEndpointMissing
          ? "No se encontró el endpoint de Slack en backend. Revisa la configuración/API del servidor."
          : requestError instanceof Error
            ? requestError.message
            : "No se pudo enviar la notificación",
      }))
    } finally {
      setSendingAlertId(null)
    }
  }

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
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sendingAlertId === alert.id}
                  onClick={() => void sendAlertNotification(alert.id)}
                >
                  {sendingAlertId === alert.id ? "Enviando..." : "Enviar notificación"}
                </Button>
                {alertNotificationMessages[alert.id] && (
                  <p className="text-xs text-muted-foreground">{alertNotificationMessages[alert.id]}</p>
                )}
              </div>
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
