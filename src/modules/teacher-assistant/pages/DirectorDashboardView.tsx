import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { DirectorDashboardResponse } from "@/modules/teacher-assistant/types"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts"

export default function DirectorDashboardView() {
  const [dashboard, setDashboard] = useState<DirectorDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const teacherProgressData = useMemo(
    () =>
      dashboard?.teachers.map((teacher) => ({
        teacher: teacher.teacher_name,
        progress: Number(teacher.average_progress_percentage.toFixed(1)),
      })) ?? [],
    [dashboard],
  )

  const teacherWorkloadData = useMemo(
    () =>
      dashboard?.teachers.map((teacher) => ({
        teacher: teacher.teacher_name,
        assignments: teacher.total_assignments,
        alerts: teacher.active_alerts,
      })) ?? [],
    [dashboard],
  )

  const assignmentStatusData = useMemo(() => {
    const statusTotals = {
      assigned: 0,
      in_progress: 0,
      completed: 0,
    }

    dashboard?.teachers.forEach((teacher) => {
      teacher.plans.forEach((plan) => {
        statusTotals[plan.status] += 1
      })
    })

    return [
      { statusKey: "assigned", status: "Asignadas", count: statusTotals.assigned, fill: "var(--color-assigned)" },
      { statusKey: "in_progress", status: "En progreso", count: statusTotals.in_progress, fill: "var(--color-in_progress)" },
      { statusKey: "completed", status: "Completadas", count: statusTotals.completed, fill: "var(--color-completed)" },
    ]
  }, [dashboard])

  const planProgressData = useMemo(() => {
    const aggregateByPlan = new Map<number, { planTitle: string; totalProgress: number; count: number }>()

    dashboard?.teachers.forEach((teacher) => {
      teacher.plans.forEach((plan) => {
        const existing = aggregateByPlan.get(plan.plan_id)
        if (existing) {
          existing.totalProgress += plan.progress_percentage
          existing.count += 1
          return
        }

        aggregateByPlan.set(plan.plan_id, {
          planTitle: plan.plan_title,
          totalProgress: plan.progress_percentage,
          count: 1,
        })
      })
    })

    return Array.from(aggregateByPlan.entries())
      .map(([planId, value]) => ({
        planId,
        plan: value.planTitle,
        avgProgress: Number((value.totalProgress / value.count).toFixed(1)),
      }))
      .sort((left, right) => right.avgProgress - left.avgProgress)
  }, [dashboard])

  const progressChartConfig = {
    progress: {
      label: "Progreso promedio",
      color: "#FBBF24",
    },
  } satisfies ChartConfig

  const planProgressChartConfig = {
    avgProgress: {
      label: "Progreso promedio del plan",
      color: "#FBBF24",
    },
  } satisfies ChartConfig

  const workloadChartConfig = {
    assignments: {
      label: "Asignaciones",
      color: "#FBBF24",
    },
    alerts: {
      label: "Alertas activas",
      color: "#D97706",
    },
  } satisfies ChartConfig

  const statusChartConfig = {
    assigned: {
      label: "Asignadas",
      color: "#334155",
    },
    in_progress: {
      label: "En progreso",
      color: "#FCD34D",
    },
    completed: {
      label: "Completadas",
      color: "#D97706",
    },
  } satisfies ChartConfig

  const kpiItems = useMemo(() => {
    const teachers = dashboard?.teachers ?? []
    const totalTeachers = teachers.length
    const totalAssignments = teachers.reduce((acc, teacher) => acc + teacher.total_assignments, 0)
    const totalActiveAlerts = teachers.reduce((acc, teacher) => acc + teacher.active_alerts, 0)
    const averageProgress =
      totalTeachers === 0
        ? 0
        : Number((teachers.reduce((acc, teacher) => acc + teacher.average_progress_percentage, 0) / totalTeachers).toFixed(1))

    return [
      { key: "teachers", label: "Docentes", value: String(totalTeachers) },
      { key: "assignments", label: "Asignaciones", value: String(totalAssignments) },
      { key: "alerts", label: "Alertas activas", value: String(totalActiveAlerts) },
      { key: "progress", label: "Progreso promedio", value: `${averageProgress}%` },
    ]
  }, [dashboard])

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((item) => (
          <Card key={item.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progreso promedio por docente</CardTitle>
          </CardHeader>
          <CardContent>
            {teacherProgressData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para graficar.</p>
            ) : (
              <ChartContainer config={progressChartConfig} className="h-[300px] w-full">
                <BarChart data={teacherProgressData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="teacher" tickLine={false} axisLine={false} interval={0} height={60} angle={-20} textAnchor="end" />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="progress" radius={4} fill="var(--color-progress)" stroke="#D97706" strokeWidth={1} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de asignaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {assignmentStatusData.every((item) => item.count === 0) ? (
              <p className="text-sm text-muted-foreground">Sin datos para graficar.</p>
            ) : (
              <ChartContainer config={statusChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                  <Pie
                    data={assignmentStatusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                  />
                  <ChartLegend content={<ChartLegendContent nameKey="statusKey" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asignaciones y alertas por docente</CardTitle>
          </CardHeader>
          <CardContent>
            {teacherWorkloadData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para graficar.</p>
            ) : (
              <ChartContainer config={workloadChartConfig} className="h-[320px] w-full">
                <BarChart data={teacherWorkloadData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="teacher" tickLine={false} axisLine={false} interval={0} height={60} angle={-20} textAnchor="end" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="assignments" radius={4} fill="var(--color-assignments)" stroke="#D97706" strokeWidth={1} />
                  <Bar dataKey="alerts" radius={4} fill="var(--color-alerts)" stroke="#B45309" strokeWidth={1} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progreso promedio por plan</CardTitle>
          </CardHeader>
          <CardContent>
            {planProgressData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para graficar.</p>
            ) : (
              <ChartContainer config={planProgressChartConfig} className="h-[320px] w-full">
                <BarChart data={planProgressData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="plan" tickLine={false} axisLine={false} interval={0} height={80} angle={-20} textAnchor="end" />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="avgProgress" radius={4} fill="var(--color-avgProgress)" stroke="#D97706" strokeWidth={1} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

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
