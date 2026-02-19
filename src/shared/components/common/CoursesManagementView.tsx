import { FormEvent, useState } from "react"
import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Input } from "@/shared/components/ui/Input"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"

const COURSE_FORM_PREFILL_STORAGE_KEY = "ofi_course_form_prefill"
const FILL_FORM_EVENT_NAME = "ofi:fill-course-creation-form"

type ToolFillCoursePayload = {
  titulo?: string
  codigo?: string
  categoria?: string
  nivel?: "Inicial" | "Intermedio" | "Avanzado" | string
  modalidad?: "Online" | "Presencial" | "Híbrido" | string
  idioma?: string
  instructor?: string
  duracion?: number | string
  cupo_maximo?: number | string
  fecha_inicio?: string
  fecha_cierre?: string
  precio?: number | string
  etiquetas?: string
  descripcion?: string
  prerrequisitos?: string
}

interface MockCourse {
  id: string
  title: string
  code: string
  category: string
  level: "Inicial" | "Intermedio" | "Avanzado"
  modality: "Online" | "Híbrido" | "Presencial"
  language: string
  instructor: string
  durationHours: number
  startDate: string
  endDate: string
  capacity: number
  enrolled: number
  price: number
  status: "Publicado" | "Borrador" | "En progreso"
  tags: string[]
  modules: string[]
  description: string
  prerequisites: string
}

const MOCK_COURSES: MockCourse[] = [
  {
    id: "COURSE-001",
    title: "Fundamentos de IA para Docentes",
    code: "IA-101",
    category: "Tecnología educativa",
    level: "Inicial",
    modality: "Online",
    language: "Español",
    instructor: "Dra. Laura Torres",
    durationHours: 18,
    startDate: "2026-03-03",
    endDate: "2026-04-07",
    capacity: 40,
    enrolled: 34,
    price: 49,
    status: "Publicado",
    tags: ["IA", "Docencia", "Productividad"],
    modules: [
      "Introducción a modelos generativos",
      "Diseño de prompts efectivos",
      "Actividades de clase asistidas por IA",
      "Evaluación y ética"
    ],
    description: "Curso base para aplicar IA en planeación, evaluación y apoyo al estudiante.",
    prerequisites: "Conocimiento básico en herramientas digitales."
  },
  {
    id: "COURSE-002",
    title: "Evaluación por Competencias",
    code: "PED-220",
    category: "Pedagogía",
    level: "Intermedio",
    modality: "Híbrido",
    language: "Español",
    instructor: "Mtro. Daniel Acosta",
    durationHours: 24,
    startDate: "2026-03-10",
    endDate: "2026-04-28",
    capacity: 30,
    enrolled: 22,
    price: 65,
    status: "Publicado",
    tags: ["Rubricas", "Competencias", "Seguimiento"],
    modules: [
      "Marco de competencias",
      "Diseño de instrumentos",
      "Retroalimentación accionable",
      "Mejora continua"
    ],
    description: "Diseña y aplica evaluaciones alineadas a resultados de aprendizaje.",
    prerequisites: "Experiencia impartiendo al menos una asignatura."
  },
  {
    id: "COURSE-003",
    title: "Gamificación en el Aula",
    code: "EDU-330",
    category: "Innovación educativa",
    level: "Intermedio",
    modality: "Online",
    language: "Español",
    instructor: "Lic. Mariana Vela",
    durationHours: 16,
    startDate: "2026-03-18",
    endDate: "2026-04-15",
    capacity: 35,
    enrolled: 35,
    price: 55,
    status: "En progreso",
    tags: ["Gamificación", "Engagement", "Dinámicas"],
    modules: [
      "Mecánicas y dinámicas",
      "Diseño de retos",
      "Sistemas de puntos y badges",
      "Métricas de participación"
    ],
    description: "Aumenta la motivación y participación del alumnado con estrategias gamificadas.",
    prerequisites: "Manejo básico de LMS o plataformas de clase."
  },
  {
    id: "COURSE-004",
    title: "Analítica de Aprendizaje con Dashboard",
    code: "DAT-410",
    category: "Datos",
    level: "Avanzado",
    modality: "Híbrido",
    language: "Español",
    instructor: "Ing. Felipe Monroy",
    durationHours: 28,
    startDate: "2026-04-02",
    endDate: "2026-05-21",
    capacity: 25,
    enrolled: 17,
    price: 89,
    status: "Publicado",
    tags: ["Datos", "KPIs", "Toma de decisiones"],
    modules: [
      "Métricas académicas clave",
      "Construcción de tableros",
      "Segmentación de estudiantes",
      "Planes de intervención"
    ],
    description: "Convierte datos académicos en decisiones pedagógicas concretas.",
    prerequisites: "Conocimiento intermedio de hojas de cálculo."
  },
  {
    id: "COURSE-005",
    title: "Diseño Instruccional para Entornos Virtuales",
    code: "LMS-205",
    category: "Diseño instruccional",
    level: "Inicial",
    modality: "Online",
    language: "Español",
    instructor: "Mtra. Paula Cárdenas",
    durationHours: 20,
    startDate: "2026-04-08",
    endDate: "2026-05-06",
    capacity: 45,
    enrolled: 29,
    price: 59,
    status: "Borrador",
    tags: ["LMS", "Contenido", "Secuenciación"],
    modules: [
      "Resultados de aprendizaje",
      "Estructura modular",
      "Actividades y recursos",
      "Evaluación formativa"
    ],
    description: "Crea cursos virtuales claros, medibles y centrados en el estudiante.",
    prerequisites: "Ninguno."
  }
]

interface CourseFormState {
  title: string
  code: string
  category: string
  level: string
  modality: string
  language: string
  instructor: string
  durationHours: string
  startDate: string
  endDate: string
  capacity: string
  price: string
  tags: string
  description: string
  prerequisites: string
}

const initialFormState: CourseFormState = {
  title: "",
  code: "",
  category: "",
  level: "Inicial",
  modality: "Online",
  language: "Español",
  instructor: "",
  durationHours: "",
  startDate: "",
  endDate: "",
  capacity: "",
  price: "",
  tags: "",
  description: "",
  prerequisites: ""
}

export default function CoursesManagementView() {
  const [searchParams] = useSearchParams()
  const createSectionRef = useRef<HTMLDivElement | null>(null)
  const [formData, setFormData] = useState<CourseFormState>(initialFormState)
  const [submitMessage, setSubmitMessage] = useState("")

  const applyToolPrefill = (rawPayload: unknown) => {
    if (!rawPayload || typeof rawPayload !== "object") return

    const payload = rawPayload as ToolFillCoursePayload
    const normalizedLevel = payload.nivel
    const normalizedModality = payload.modalidad

    setFormData((previous) => ({
      ...previous,
      title: payload.titulo ?? previous.title,
      code: payload.codigo ?? previous.code,
      category: payload.categoria ?? previous.category,
      level: normalizedLevel === "Inicial" || normalizedLevel === "Intermedio" || normalizedLevel === "Avanzado"
        ? normalizedLevel
        : previous.level,
      modality: normalizedModality === "Online" || normalizedModality === "Presencial" || normalizedModality === "Híbrido"
        ? normalizedModality
        : previous.modality,
      language: payload.idioma ?? previous.language,
      instructor: payload.instructor ?? previous.instructor,
      durationHours: payload.duracion !== undefined ? String(payload.duracion) : previous.durationHours,
      capacity: payload.cupo_maximo !== undefined ? String(payload.cupo_maximo) : previous.capacity,
      startDate: payload.fecha_inicio ?? previous.startDate,
      endDate: payload.fecha_cierre ?? previous.endDate,
      price: payload.precio !== undefined ? String(payload.precio) : previous.price,
      tags: payload.etiquetas ?? previous.tags,
      description: payload.descripcion ?? previous.description,
      prerequisites: payload.prerrequisitos ?? previous.prerequisites,
    }))

    setSubmitMessage("Formulario autocompletado con datos enviados por Sofia.")
    createSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (searchParams.get("view") === "create") {
      createSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [searchParams])

  useEffect(() => {
    const storedPayload = localStorage.getItem(COURSE_FORM_PREFILL_STORAGE_KEY)
    if (storedPayload) {
      try {
        applyToolPrefill(JSON.parse(storedPayload))
      } catch {
        // ignore malformed storage payload
      } finally {
        localStorage.removeItem(COURSE_FORM_PREFILL_STORAGE_KEY)
      }
    }

    const handleFillEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ToolFillCoursePayload>
      applyToolPrefill(customEvent.detail)
    }

    window.addEventListener(FILL_FORM_EVENT_NAME, handleFillEvent as EventListener)

    return () => {
      window.removeEventListener(FILL_FORM_EVENT_NAME, handleFillEvent as EventListener)
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitMessage("Formulario enviado. No se ejecutó ninguna acción de guardado.")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Gestión de cursos</h1>
        <p className="text-sm text-muted-foreground">Consulta cursos disponibles y registra nuevos cursos desde un formulario.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cursos disponibles (mock)</CardTitle>
            <CardDescription>{MOCK_COURSES.length} cursos con información completa para pruebas visuales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_COURSES.map((course) => (
              <div key={course.id} className="rounded-md border border-border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <h3 className="text-base font-semibold text-foreground">{course.title}</h3>
                  <Badge variant="secondary">{course.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{course.description}</p>
                <div className="grid grid-cols-1 gap-2 text-sm text-foreground md:grid-cols-2">
                  <p><strong>Código:</strong> {course.code}</p>
                  <p><strong>Categoría:</strong> {course.category}</p>
                  <p><strong>Nivel:</strong> {course.level}</p>
                  <p><strong>Modalidad:</strong> {course.modality}</p>
                  <p><strong>Idioma:</strong> {course.language}</p>
                  <p><strong>Instructor:</strong> {course.instructor}</p>
                  <p><strong>Duración:</strong> {course.durationHours} horas</p>
                  <p><strong>Fechas:</strong> {course.startDate} a {course.endDate}</p>
                  <p><strong>Cupos:</strong> {course.enrolled}/{course.capacity}</p>
                  <p><strong>Precio:</strong> ${course.price} USD</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Módulos</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {course.modules.map((moduleName) => (
                      <li key={moduleName}>{moduleName}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground"><strong>Prerrequisitos:</strong> {course.prerequisites}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card ref={createSectionRef}>
          <CardHeader>
            <CardTitle>Crear curso</CardTitle>
            <CardDescription>Completa el formulario y envíalo. El envío es solo demostrativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} required />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" value={formData.code} onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Input id="category" value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel</Label>
                  <select id="level" value={formData.level} onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option>Inicial</option>
                    <option>Intermedio</option>
                    <option>Avanzado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modality">Modalidad</Label>
                  <select id="modality" value={formData.modality} onChange={(e) => setFormData((prev) => ({ ...prev, modality: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option>Online</option>
                    <option>Híbrido</option>
                    <option>Presencial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Input id="language" value={formData.language} onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input id="instructor" value={formData.instructor} onChange={(e) => setFormData((prev) => ({ ...prev, instructor: e.target.value }))} required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="durationHours">Duración (horas)</Label>
                  <Input id="durationHours" type="number" min={1} value={formData.durationHours} onChange={(e) => setFormData((prev) => ({ ...prev, durationHours: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Cupo máximo</Label>
                  <Input id="capacity" type="number" min={1} value={formData.capacity} onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))} required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de cierre</Label>
                  <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))} required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (USD)</Label>
                  <Input id="price" type="number" min={0} value={formData.price} onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Etiquetas</Label>
                  <Input id="tags" placeholder="IA, Docencia, Evaluación" value={formData.tags} onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea id="description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prerequisites">Prerrequisitos</Label>
                <textarea id="prerequisites" value={formData.prerequisites} onChange={(e) => setFormData((prev) => ({ ...prev, prerequisites: e.target.value }))} className="flex min-h-[76px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </div>

              <Button type="submit" className="w-full">Enviar curso</Button>
            </form>

            {submitMessage && (
              <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {submitMessage}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
