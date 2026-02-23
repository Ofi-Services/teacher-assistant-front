import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/Input"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { PaginatedResponse, TrainingPlan } from "@/modules/teacher-assistant/types"

export default function PlanListView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [response, setResponse] = useState<PaginatedResponse<TrainingPlan> | null>(null)

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await teacherAssistantApi.listPlans({ search, page })
      setResponse(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo listar planes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPlans()
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Planes de formación</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/director/plans/new")}>Crear plan</Button>
          <Button variant="outline" onClick={() => void loadPlans()} disabled={loading}>
            Refrescar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar planes</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="search" />
          <Button onClick={() => void loadPlans()}>Buscar</Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Cargando planes...</p>}

      <div className="space-y-3">
        {response?.results.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="pt-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">{plan.title}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Duración: {plan.duration_weeks} semanas · Módulos: {plan.modules.length}
                </p>
              </div>
              <Button onClick={() => navigate(`/director/plans/new?edit=${plan.id}`)}>Editar</Button>
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
