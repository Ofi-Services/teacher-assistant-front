import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/Input"
import { Label } from "@/shared/components/ui/label"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { PlanAssignment } from "@/modules/teacher-assistant/types"
import { useAuth } from "@/shared/hooks/use-auth"

export default function AssignmentDetailView() {
  const { id } = useParams()
  const assignmentId = useMemo(() => Number(id ?? "0"), [id])
  const { user } = useAuth()

  const [assignment, setAssignment] = useState<PlanAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    module: "",
    percent_completed: "0",
    notes: "",
    evidence_url: "",
  })

  const loadAssignment = async () => {
    try {
      setLoading(true)
      setError("")
      const data =
        user?.role === "teacher"
          ? await teacherAssistantApi.getMyAssignments({ page: 1 })
          : await teacherAssistantApi.listAssignments({ page: 1 })
      const selected = data.results.find((entry) => entry.id === assignmentId) ?? null
      setAssignment(selected)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cargar la asignación")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (assignmentId > 0) {
      void loadAssignment()
    }
  }, [assignmentId, user?.role])

  const updateProgress = async (event: React.FormEvent) => {
    event.preventDefault()
    if (assignmentId <= 0) {
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")
      await teacherAssistantApi.updateProgress(assignmentId, {
        module: Number(form.module),
        percent_completed: Number(form.percent_completed),
        notes: form.notes,
        evidence_url: form.evidence_url,
      })
      setSuccess("Progreso actualizado correctamente")
      await loadAssignment()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar progreso")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Detalle de asignación #{assignmentId}</h1>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-primary">{success}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Estado actual</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {!loading && !assignment && <p className="text-sm text-muted-foreground">Asignación no encontrada en la página actual.</p>}
          {assignment && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Plan ID: {assignment.plan}</p>
              <p>Teacher ID: {assignment.teacher}</p>
              <p>Estado: {assignment.status}</p>
              <p>Progreso: {assignment.progress_percentage}%</p>
              <p>Última actividad: {assignment.last_activity_at ?? "N/A"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actualizar progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={updateProgress}>
            <div>
              <Label htmlFor="module">Module ID</Label>
              <Input
                id="module"
                type="number"
                value={form.module}
                onChange={(event) => setForm((prev) => ({ ...prev, module: event.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="percent-completed">% completado</Label>
              <Input
                id="percent-completed"
                type="number"
                min={0}
                max={100}
                value={form.percent_completed}
                onChange={(event) => setForm((prev) => ({ ...prev, percent_completed: event.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="evidence">URL evidencia</Label>
              <Input
                id="evidence"
                type="url"
                value={form.evidence_url}
                onChange={(event) => setForm((prev) => ({ ...prev, evidence_url: event.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Actualizar progreso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
