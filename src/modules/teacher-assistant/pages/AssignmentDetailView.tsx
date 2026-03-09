import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Progress } from "@/shared/components/ui/progress"
import { teacherAssistantApi } from "@/modules/teacher-assistant/api/teacherAssistantApi"
import { PlanAssignment, TrainingPlan } from "@/modules/teacher-assistant/types"
import { useAuth } from "@/shared/hooks/use-auth"
import { cn } from "@/shared/lib/utils"

export default function AssignmentDetailView() {
  const TARGET_ASSIGNMENT_ID_FOR_INLINE_EVIDENCE = 9
  const INLINE_EVIDENCE_BY_MODULE_ORDER: Record<number, string> = {
    1: "/proof1.png",
    2: "/proof%20practicas%20de%20assesment.png",
  }
  const { id } = useParams()
  const assignmentId = useMemo(() => Number(id ?? "0"), [id])
  const { user } = useAuth()

  const [assignment, setAssignment] = useState<PlanAssignment | null>(null)
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [completingModuleId, setCompletingModuleId] = useState<number | null>(null)
  const [moduleEvidenceFiles, setModuleEvidenceFiles] = useState<Record<number, File | null>>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const isTeacherView = user?.role === "teacher"
  const canViewInlineEvidence = user?.role === "director" || user?.role === "teacher"
  const [expandedEvidenceModuleId, setExpandedEvidenceModuleId] = useState<number | null>(null)

  const toSafePercentage = (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(parsed)) {
      return 0
    }

    return Math.max(0, Math.min(100, parsed))
  }

  const getAssignmentStatusLabel = (statusValue: PlanAssignment["status"]) => {
    if (statusValue === "assigned") {
      return "Asignado"
    }
    if (statusValue === "in_progress") {
      return "En progreso"
    }
    return "Completado"
  }

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

      if (selected) {
        const plansResponse = await teacherAssistantApi.listPlans({ page: 1 })
        const selectedPlan = plansResponse.results.find((entry) => entry.id === selected.plan) ?? null
        setPlan(selectedPlan)
      } else {
        setPlan(null)
      }
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

  const getModuleProgress = (moduleId?: number) => {
    if (!moduleId || !assignment?.progress_records) {
      return null
    }

    return assignment.progress_records
      .filter((record) => record.module === moduleId)
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0] ?? null
  }

  const getModuleStatus = (percent: number) => {
    if (percent >= 100) {
      return "Completado"
    }
    if (percent > 0) {
      return "En progreso"
    }
    return "Pendiente"
  }

  const calculatedTotalProgress = useMemo(() => {
    if (!assignment || !plan || plan.modules.length === 0) {
      return toSafePercentage(assignment?.progress_percentage)
    }

    const latestProgressByModule = new Map<number, number>()

    assignment.progress_records?.forEach((record) => {
      const safePercentCompleted = toSafePercentage(record.percent_completed)
      const currentValue = latestProgressByModule.get(record.module)
      if (currentValue === undefined || safePercentCompleted > currentValue) {
        latestProgressByModule.set(record.module, safePercentCompleted)
      }
    })

    const totalPercent = plan.modules.reduce((accumulator, module) => {
      if (!module.id) {
        return accumulator
      }

      return accumulator + (latestProgressByModule.get(module.id) ?? 0)
    }, 0)

    return toSafePercentage(Number((totalPercent / plan.modules.length).toFixed(1)))
  }, [assignment, plan])

  const completeModule = async (moduleId?: number) => {
    if (!moduleId || assignmentId <= 0) {
      return
    }

    const currentProgress = getModuleProgress(moduleId)
    const selectedEvidenceFile = moduleEvidenceFiles[moduleId] ?? null

    try {
      setCompletingModuleId(moduleId)
      setError("")
      setSuccess("")
      await teacherAssistantApi.updateProgress(assignmentId, {
        module: moduleId,
        percent_completed: 100,
        notes: currentProgress?.notes || "Módulo completado",
        evidence_url: currentProgress?.evidence_url || "https://example.com/completed",
        evidence_file: selectedEvidenceFile,
      })
      setSuccess("Módulo marcado como completado")
      setModuleEvidenceFiles((previous) => ({
        ...previous,
        [moduleId]: null,
      }))
      await loadAssignment()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo completar el módulo")
    } finally {
      setCompletingModuleId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Detalle de asignación #{assignmentId}</h1>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-primary">{success}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Resumen general</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {!loading && !assignment && <p className="text-sm text-muted-foreground">Asignación no encontrada en la página actual.</p>}
          {assignment && (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{plan?.title ?? `Plan #${assignment.plan}`}</p>
              <p>Estado: {getAssignmentStatusLabel(assignment.status)}</p>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Progreso total</span>
                  <span>{calculatedTotalProgress}%</span>
                </div>
                <Progress value={calculatedTotalProgress} />
              </div>
              <p>Última actividad: {assignment.last_activity_at ?? "Sin actividad"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Módulos del plan</CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && !plan && (
            <p className="text-sm text-muted-foreground">No se pudieron cargar los módulos de este plan.</p>
          )}

          <div className="space-y-1">
            {plan?.modules
              .slice()
              .sort((left, right) => left.order - right.order)
              .map((module, index) => {
                const moduleProgress = getModuleProgress(module.id)
                const modulePercent = toSafePercentage(moduleProgress?.percent_completed)
                const moduleStatus = getModuleStatus(modulePercent)
                const isLast = index === (plan.modules.length - 1)
                const isCompleted = modulePercent >= 100
                const moduleEvidenceUrl = moduleProgress?.evidence_url?.trim()
                const inlineEvidenceImage = INLINE_EVIDENCE_BY_MODULE_ORDER[module.order]
                const shouldShowInlineDirectorEvidence =
                  canViewInlineEvidence
                  && assignmentId === TARGET_ASSIGNMENT_ID_FOR_INLINE_EVIDENCE
                  && Boolean(inlineEvidenceImage)
                  && Boolean(moduleEvidenceUrl)

                return (
                  <div key={`${module.title}-${module.order}-${index}`} className="relative pl-10 pb-4">
                    {!isLast && <div className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-px bg-border" />}

                    <div className={cn(
                      "absolute left-0 top-1 h-8 w-8 rounded-full border flex items-center justify-center text-xs font-semibold",
                      isCompleted ? "border-primary bg-primary/20 text-primary" : "border-border bg-card",
                    )}>
                      {module.order}
                    </div>

                    <div className={cn(
                      "rounded-md border p-4",
                      isCompleted ? "border-primary/50 bg-primary/5" : "border-border",
                    )}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Módulo {module.order}</p>
                          <h3 className="font-medium">{module.title}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">{module.expected_days} días</span>
                          <p className={cn("text-xs mt-1", isCompleted ? "text-primary font-medium" : "text-muted-foreground")}>{moduleStatus}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">{module.description}</p>

                      {module.link && module.link.trim() !== "" && (
                        <p className="text-sm mt-2">
                          <a
                            href={module.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline underline-offset-2 break-all"
                          >
                            Ver recurso del módulo
                          </a>
                        </p>
                      )}

                      <div className="mt-3">
                        <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                          <span>Avance del módulo</span>
                          <span>{modulePercent}%</span>
                        </div>
                        <Progress value={modulePercent} />
                      </div>

                      {moduleProgress?.notes && (
                        <p className="text-sm mt-3">
                          <span className="font-medium">Notas:</span> {moduleProgress.notes}
                        </p>
                      )}

                      {moduleEvidenceUrl && (
                        <p className="text-sm mt-3">
                          <span className="font-medium">Evidencia de finalización:</span>{" "}
                          {shouldShowInlineDirectorEvidence ? (
                            <button
                              type="button"
                              className="text-primary underline underline-offset-2 break-all"
                              onClick={() => setExpandedEvidenceModuleId((previous) => (previous === module.id ? null : module.id ?? null))}
                            >
                              Ver evidencia
                            </button>
                          ) : (
                            <a
                              href={moduleEvidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline underline-offset-2 break-all"
                            >
                              Ver evidencia
                            </a>
                          )}
                        </p>
                      )}

                      {shouldShowInlineDirectorEvidence && expandedEvidenceModuleId === module.id && (
                        <div className="mt-3 rounded-md border border-border p-2">
                          <img src={inlineEvidenceImage} alt="Evidencia de finalización" className="w-full rounded-md" />
                        </div>
                      )}

                      {isTeacherView && (
                        <>
                          <div className="mt-3 space-y-1">
                            <label className="text-sm font-medium" htmlFor={`evidence-file-${module.id ?? index}`}>
                              Evidencia de finalización
                            </label>
                            <input
                              id={`evidence-file-${module.id ?? index}`}
                              type="file"
                              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1 file:text-sm"
                              onChange={(event) => {
                                const selectedFile = event.target.files?.[0] ?? null
                                const targetModuleId = module.id
                                if (!targetModuleId) {
                                  return
                                }

                                setModuleEvidenceFiles((previous) => ({
                                  ...previous,
                                  [targetModuleId]: selectedFile,
                                }))
                              }}
                              disabled={isCompleted || completingModuleId === module.id}
                            />
                          </div>

                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              variant={isCompleted ? "outline" : "default"}
                              onClick={() => void completeModule(module.id)}
                              disabled={isCompleted || completingModuleId === module.id}
                            >
                              {isCompleted
                                ? "Completado"
                                : completingModuleId === module.id
                                  ? "Completando..."
                                  : "Completar"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
