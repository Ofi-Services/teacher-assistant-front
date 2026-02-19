import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp
} from "lucide-react"
import { 
  useGetUserTrainingTracksQuery,
  useGetTrainingTrackDetailQuery,
  type TrainingTrack 
} from "../store/leaderApi"
import { Progress } from "@/shared/components/ui/progress"
import { Card, CardContent } from "@/shared/components/ui/card"
import FilterControls, { FilterConfig } from "@/shared/components/common/FilterControls"

interface TrainingTracksDialogProps {
  userId: number
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TrainingTracksDialog({ 
  userId, 
  userName,
  open, 
  onOpenChange 
}: TrainingTracksDialogProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0)
  
  // Filter states
  const [searchValue, setSearchValue] = useState("")
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "all",
    progress: "all",
    dueDate: "all"
  })
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Fetch training tracks
  const { 
    data: trainingTracks, 
    isLoading: tracksLoading, 
    error: tracksError 
  } = useGetUserTrainingTracksQuery(userId, { skip: !open })

  // Fetch track details when one is selected
  const { 
    data: trackDetail, 
    isLoading: detailLoading, 
    error: detailError 
  } = useGetTrainingTrackDetailQuery(
    { userId, trackId: selectedTrackId! },
    { skip: !selectedTrackId }
  )

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "Estado",
      placeholder: "Todos los estados",
      icon: CheckCircle2,
      options: [
        { value: "completed", label: "Completado" },
        { value: "in_progress", label: "En progreso" },
        { value: "overdue", label: "Vencido" }
      ]
    },
    {
      key: "progress",
      label: "Progreso",
      placeholder: "Todo el progreso",
      icon: TrendingUp,
      options: [
        { value: "0-25", label: "0-25%" },
        { value: "26-50", label: "26-50%" },
        { value: "51-75", label: "51-75%" },
        { value: "76-100", label: "76-100%" }
      ]
    },
    {
      key: "dueDate",
      label: "Fecha límite",
      placeholder: "Todas las fechas límite",
      icon: Calendar,
      options: [
        { value: "this_week", label: "Esta semana" },
        { value: "this_month", label: "Este mes" },
        { value: "next_month", label: "Próximo mes" },
        { value: "overdue", label: "Vencido" }
      ]
    }
  ]
  // Filtered and sorted tracks
const filteredTracks = useMemo(() => {
  if (!trainingTracks) return []

  const filtered = trainingTracks.filter((track) => {
    // Search filter
    if (searchValue) {
      const searchLower = searchValue.toLowerCase()
      const matchesTitle = track.title.toLowerCase().includes(searchLower)
      const matchesPlatform = track.platform.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesPlatform) return false
    }

    // Status filter
    if (filterValues.status !== "all") {
      if (filterValues.status === "completed" && !track.is_completed) return false
      if (filterValues.status === "overdue" && !track.is_overdue) return false
      if (filterValues.status === "in_progress" && (track.is_completed || track.is_overdue)) return false
    }

    // Progress filter
    if (filterValues.progress !== "all") {
      const progress = track.progress_percentage
      const [min, max] = filterValues.progress.split("-").map(Number)
      if (progress < min || progress > max) return false
    }

    // Due date filter
    if (filterValues.dueDate !== "all") {
      const dueDate = new Date(track.due_date)
      dueDate.setHours(0, 0, 0, 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (filterValues.dueDate === "overdue") {
        // Fechas anteriores a hoy
        if (dueDate >= today) return false
      }
      
      if (filterValues.dueDate === "this_week") {
        // Desde hoy hasta 7 días adelante
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        if (dueDate < today || dueDate > weekFromNow) return false
      }
      
      if (filterValues.dueDate === "this_month") {
        // Desde hoy hasta el final del mes actual
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endOfMonth.setHours(0, 0, 0, 0)
        if (dueDate < today || dueDate > endOfMonth) return false
      }
      
      if (filterValues.dueDate === "next_month") {
        // Todo el próximo mes calendario
        const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        startOfNextMonth.setHours(0, 0, 0, 0)
        endOfNextMonth.setHours(0, 0, 0, 0)
        if (dueDate < startOfNextMonth || dueDate > endOfNextMonth) return false
      }
    }

    return true
  })

  // Sort by title
  filtered.sort((a, b) => {
    const comparison = a.title.localeCompare(b.title)
    return sortOrder === "asc" ? comparison : -comparison
  })

  return filtered
}, [trainingTracks, searchValue, filterValues, sortOrder])

  const handleTrackSelect = (trackId: number) => {
    setSelectedTrackId(trackId)
    setCurrentCourseIndex(0)
  }

  const handleBack = () => {
    setSelectedTrackId(null)
    setCurrentCourseIndex(0)
  }

  const handleNextCourse = () => {
    if (trackDetail && currentCourseIndex < trackDetail.courses.length - 1) {
      setCurrentCourseIndex(prev => prev + 1)
    }
  }

  const handlePrevCourse = () => {
    if (currentCourseIndex > 0) {
      setCurrentCourseIndex(prev => prev - 1)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSortToggle = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (track: TrainingTrack) => {
    if (track.is_completed) {
      return <Badge className="bg-green-500">Completado</Badge>
    }
    if (track.is_overdue) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    return <Badge variant="secondary">En progreso</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedTrackId ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                Plan de formación - Detalles
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5" />
                Planes de formación de {userName}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* List View - Training Tracks */}
        {!selectedTrackId && (
          <div className="space-y-4">
            {/* Filter Controls */}
            {trainingTracks && trainingTracks.length > 0 && (
              <FilterControls
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Buscar por título o plataforma..."
                filters={filterConfigs}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                sortOrder={sortOrder}
                onSortToggle={handleSortToggle}
                sortLabels={{ asc: "A-Z", desc: "Z-A" }}
              />
            )}

            {tracksLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            )}

            {Boolean(tracksError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error al cargar los planes de formación. Inténtalo de nuevo.
                </AlertDescription>
              </Alert>
            )}

            {trainingTracks && trainingTracks.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este usuario no tiene planes de formación asignados.
                </AlertDescription>
              </Alert>
            )}

            {trainingTracks && trainingTracks.length > 0 && filteredTracks.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ningún plan coincide con tus filtros. Ajusta la búsqueda o los filtros.
                </AlertDescription>
              </Alert>
            )}

            {filteredTracks.map((track) => (
              <Card 
                key={track.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTrackSelect(track.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Plataforma: {track.platform}
                        </p>
                      </div>
                      {getStatusBadge(track)}
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{track.progress_percentage}%</span>
                      </div>
                      <Progress value={track.progress_percentage} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>
                          <span className="font-semibold">{track.completed_courses}</span>
                          <span className="text-muted-foreground">/{track.total_courses}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground">
                          {formatDate(track.due_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-muted-foreground">
                          {track.is_overdue ? "Vencido" : "Activo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail View - Training Track Detail with Pagination */}
        {selectedTrackId && (
          <div className="space-y-6">
            {detailLoading && (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            )}

            {Boolean(detailError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error al cargar los detalles. Inténtalo de nuevo.
                </AlertDescription>
              </Alert>
            )}

            {trackDetail && (
              <>
                {/* Track Summary */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-xl mb-2">
                          {trackDetail.training_track.title}
                        </h3>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {trackDetail.training_track.platform}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Vence: {formatDate(trackDetail.training_track.due_date)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso general</span>
                          <span className="font-semibold">
                            {trackDetail.assignment.progress_percentage}%
                          </span>
                        </div>
                        <Progress 
                          value={trackDetail.assignment.progress_percentage} 
                          className="h-2" 
                        />
                        <p className="text-sm text-muted-foreground">
                          {trackDetail.assignment.completed_courses} de {trackDetail.training_track.total_courses} cursos completados
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Pagination */}
                {trackDetail.courses.length > 0 && (
                  <>
                    <Card className="border-2">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Course Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Curso {currentCourseIndex + 1} de {trackDetail.courses.length}
                                </span>
                                {trackDetail.courses[currentCourseIndex].completed && (
                                  <Badge className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completado
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-lg">
                                {trackDetail.courses[currentCourseIndex].title}
                              </h4>
                            </div>
                          </div>

                          {/* Course Status */}
                          <div className="space-y-3 pt-4">
                            {trackDetail.courses[currentCourseIndex].has_submission && (
                              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">Evidence Submitted</p>
                                  {trackDetail.courses[currentCourseIndex].submission_link && (
                                    <a 
                                      href={trackDetail.courses[currentCourseIndex].submission_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:underline"
                                    >
                                      Ver evidencia
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {!trackDetail.courses[currentCourseIndex].completed && (
                              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                <Clock className="h-5 w-5 text-orange-500" />
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                  Pendiente de completar
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        onClick={handlePrevCourse}
                        disabled={currentCourseIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>

                      <span className="text-sm text-muted-foreground">
                        {currentCourseIndex + 1} / {trackDetail.courses.length}
                      </span>

                      <Button
                        variant="outline"
                        onClick={handleNextCourse}
                        disabled={currentCourseIndex === trackDetail.courses.length - 1}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}