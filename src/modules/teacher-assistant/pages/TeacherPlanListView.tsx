import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale from "@fullcalendar/core/locales/es"
import type { EventInput } from "@fullcalendar/core/index.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { useToast } from "@/shared/hooks/use-toast"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { PaginatedResponse, PlanAssignment } from "@/modules/teacher-assistant/types"

export default function TeacherPlanListView() {
  const PAGE_SIZE = 8
  const { toast } = useToast()
  const [response, setResponse] = useState<PaginatedResponse<PlanAssignment> | null>(null)
  const [planTitles, setPlanTitles] = useState<Record<number, string>>({})
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showTeamsMeetings, setShowTeamsMeetings] = useState(false)
  const [isSyncingTeams, setIsSyncingTeams] = useState(false)
  const teamsSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toDateKey = (dateValue: Date) => {
    const year = dateValue.getFullYear()
    const month = String(dateValue.getMonth() + 1).padStart(2, "0")
    const day = String(dateValue.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const getDueDateKey = (assignment: PlanAssignment) => {
    if (!assignment.due_date) {
      return null
    }

    return assignment.due_date.split("T")[0] ?? null
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) {
      return "Sin fecha límite"
    }

    const parsedDate = new Date(dueDate)
    if (Number.isNaN(parsedDate.getTime())) {
      return dueDate
    }

    return parsedDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDueDateForEvent = (dueDate: string | null) => {
    if (!dueDate) {
      return null
    }

    const key = dueDate.split("T")[0]
    return key ?? null
  }

  const formatDateLabel = (dateValue: Date) => {
    return dateValue.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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

  useEffect(() => {
    return () => {
      if (teamsSyncTimeoutRef.current) {
        clearTimeout(teamsSyncTimeoutRef.current)
        teamsSyncTimeoutRef.current = null
      }
    }
  }, [])

  const assignmentsWithDueDate = useMemo(() => {
    return (response?.results ?? []).filter((assignment) => !!getDueDateKey(assignment))
  }, [response])

  const deadlineEvents = useMemo(() => {
    return assignmentsWithDueDate
      .map((assignment) => {
        const eventDate = formatDueDateForEvent(assignment.due_date)
        if (!eventDate) {
          return null
        }

        const event: EventInput = {
          id: String(assignment.id),
          title: assignment.plan_title?.trim() || planTitles[assignment.plan] || `Asignación #${assignment.id}`,
          date: eventDate,
          allDay: true,
        }

        return event
      })
      .filter((event): event is EventInput => event !== null)
  }, [assignmentsWithDueDate, planTitles])

  const teamsMeetingMockEvents = useMemo(() => {
    const year = 2026
    const month = 3
    const meetingTimes = [
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "14:00",
      "14:30",
      "15:00",
    ]

    const topics = [
      "Weekly Planning",
      "Sprint Sync",
      "Department Update",
      "Project Kickoff",
      "Stakeholder Review",
      "Progress Check-in",
      "Roadmap Alignment",
      "Curriculum Coordination",
      "Teacher Follow-up",
      "Academic Committee",
    ]

    return Array.from({ length: 20 }, (_, index) => {
      const day = ((index * 2) % 31) + 1
      const time = meetingTimes[index % meetingTimes.length]
      const [hours, minutes] = time.split(":").map(Number)
      const start = new Date(year, month - 1, day, hours, minutes, 0)
      const title = `Teams Meeting - ${topics[index % topics.length]} ${index + 1}`

      const event: EventInput = {
        id: `teams-meeting-${index + 1}`,
        title,
        start,
        allDay: false,
        extendedProps: {
          category: "Teams Meeting",
        },
      }

      return event
    })
  }, [])

  const calendarEvents = useMemo(() => {
    return [...deadlineEvents, ...(showTeamsMeetings ? teamsMeetingMockEvents : [])]
  }, [deadlineEvents, showTeamsMeetings, teamsMeetingMockEvents])

  const selectedDateAssignments = useMemo(() => {
    if (!selectedDeadlineDate) {
      return []
    }

    const selectedKey = toDateKey(selectedDeadlineDate)
    return assignmentsWithDueDate.filter((assignment) => getDueDateKey(assignment) === selectedKey)
  }, [assignmentsWithDueDate, selectedDeadlineDate])

  const setSelectedDateFromDateKey = (dateKey: string) => {
    const selectedDate = new Date(`${dateKey}T00:00:00`)
    if (Number.isNaN(selectedDate.getTime())) {
      return
    }

    setSelectedDeadlineDate(selectedDate)
  }

  const handleSyncWithTeams = () => {
    if (isSyncingTeams || showTeamsMeetings) {
      return
    }

    setIsSyncingTeams(true)
    teamsSyncTimeoutRef.current = setTimeout(() => {
      setShowTeamsMeetings(true)
      setIsSyncingTeams(false)
      teamsSyncTimeoutRef.current = null

      toast({
        title: "Sincronización completada",
        description: "Tu calendaro ha sido sincronizado",
      })
    }, 500)
  }

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
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Calendario de fechas límite</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleSyncWithTeams} disabled={isSyncingTeams || showTeamsMeetings}>
            {isSyncingTeams ? "Sincronizando..." : showTeamsMeetings ? "Sincronizado" : "Sincronizar con Microsoft Teams"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border p-3">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              height="auto"
              events={calendarEvents}
              eventClick={(info) => {
                const eventStart = info.event.start
                const dateKey = eventStart
                  ? `${eventStart.getFullYear()}-${String(eventStart.getMonth() + 1).padStart(2, "0")}-${String(eventStart.getDate()).padStart(2, "0")}`
                  : info.event.startStr.split("T")[0]
                setSelectedDateFromDateKey(dateKey)
              }}
              dateClick={(info) => {
                setSelectedDateFromDateKey(info.dateStr)
              }}
            />
          </div>

          {!selectedDeadlineDate && (
            <p className="text-sm text-muted-foreground">Selecciona una fecha para ver qué asignaciones vencen ese día.</p>
          )}

          {selectedDeadlineDate && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Vencimientos para {formatDateLabel(selectedDeadlineDate)}</p>
              {selectedDateAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay asignaciones con fecha límite este día.</p>
              ) : (
                selectedDateAssignments.map((assignment) => (
                  <div key={`deadline-${assignment.id}`} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{assignment.plan_title?.trim() || planTitles[assignment.plan] || `Asignación #${assignment.id}`}</p>
                      <p className="text-sm text-muted-foreground">Estado: {getStatusLabel(assignment.status)}</p>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/teacher/assignments/${assignment.id}`}>Abrir detalle</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Fecha límite: {formatDueDate(assignment.due_date)}
                  {assignment.due_date && <Badge variant="outline">Con plazo</Badge>}
                </p>
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
