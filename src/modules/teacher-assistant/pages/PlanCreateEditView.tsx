import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/Input"
import { Label } from "@/shared/components/ui/label"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"

interface PlanFormModule {
  title: string
  description: string
  order: number
  expected_days: number
}

export default function PlanCreateEditView() {
  const [searchParams] = useSearchParams()
  const editId = useMemo(() => Number(searchParams.get("edit") ?? 0), [searchParams])
  const isEdit = Number.isFinite(editId) && editId > 0

  const [saving, setSaving] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [objectives, setObjectives] = useState("")
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [modules, setModules] = useState<PlanFormModule[]>([
    { title: "", description: "", order: 1, expected_days: 7 },
  ])

  const addModule = () => {
    setModules((prev) => [...prev, { title: "", description: "", order: prev.length + 1, expected_days: 7 }])
  }

  const updateModule = (index: number, patch: Partial<PlanFormModule>) => {
    setModules((prev) => prev.map((module, currentIndex) => (currentIndex === index ? { ...module, ...patch } : module)))
  }

  useEffect(() => {
    const loadPlanForEdit = async () => {
      if (!isEdit) {
        return
      }

      try {
        setLoadingPlan(true)
        setError("")
        const plan = await teacherAssistantApi.getPlan(editId)

        setTitle(plan.title)
        setDescription(plan.description)
        setObjectives(plan.objectives)
        setDurationWeeks(plan.duration_weeks)
        setModules(
          plan.modules.length > 0
            ? plan.modules
                .slice()
                .sort((left, right) => left.order - right.order)
                .map((module) => ({
                  title: module.title,
                  description: module.description,
                  order: module.order,
                  expected_days: module.expected_days,
                }))
            : [{ title: "", description: "", order: 1, expected_days: 7 }],
        )
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "No se pudo cargar el plan para edición")
      } finally {
        setLoadingPlan(false)
      }
    }

    void loadPlanForEdit()
  }, [editId, isEdit])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      if (isEdit) {
        await teacherAssistantApi.updatePlan(editId, {
          title,
          description,
          objectives,
          duration_weeks: durationWeeks,
          modules,
        })
      } else {
        await teacherAssistantApi.createPlan({
          title,
          description,
          objectives,
          duration_weeks: durationWeeks,
          modules,
        })
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo guardar el plan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{isEdit ? "Editar plan" : "Crear plan"}</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loadingPlan && <p className="text-sm text-muted-foreground">Cargando plan para edición...</p>}

      <Card>
        <CardHeader>
          <CardTitle>Datos del plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="plan-title">Título</Label>
              <Input id="plan-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor="plan-description">Descripción</Label>
              <textarea
                id="plan-description"
                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="plan-objectives">Objetivos</Label>
              <textarea
                id="plan-objectives"
                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={objectives}
                onChange={(event) => setObjectives(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="plan-duration">Duración (semanas)</Label>
              <Input
                id="plan-duration"
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(event) => setDurationWeeks(Number(event.target.value))}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Módulos</h2>
                <Button type="button" variant="outline" onClick={addModule}>
                  Agregar módulo
                </Button>
              </div>
              {modules.map((module, index) => (
                <div key={`${module.order}-${index}`} className="rounded-md border border-border p-3 space-y-2">
                  <Input
                    value={module.title}
                    placeholder="Título módulo"
                    onChange={(event) => updateModule(index, { title: event.target.value })}
                    required
                  />
                  <textarea
                    className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={module.description}
                    placeholder="Descripción módulo"
                    onChange={(event) => updateModule(index, { description: event.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={module.order}
                      onChange={(event) => updateModule(index, { order: Number(event.target.value) })}
                      required
                    />
                    <Input
                      type="number"
                      min={1}
                      value={module.expected_days}
                      onChange={(event) => updateModule(index, { expected_days: Number(event.target.value) })}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEdit ? "Actualizar plan" : "Crear plan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
