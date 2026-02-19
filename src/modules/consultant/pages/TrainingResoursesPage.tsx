import { useState, useMemo } from "react"
import { FileText, Download, Clock, Search, ExternalLink } from "lucide-react"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Input } from "@/shared/components/ui/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card"

// Mock data for training resources
const mockResources = [
  {
    id: "1",
    title: "Guía de buenas prácticas de React",
    description: "Guía completa que cubre patrones modernos de React, hooks y técnicas de optimización de rendimiento.",
    type: "PDF",
    category: "Desarrollo",
    fileSize: "2.5 MB",
    duration: "45 min de lectura",
    accessType: "download",
    uploadedDate: "2024-10-15",
    tags: ["React", "Frontend", "Buenas prácticas"]
  },
  {
    id: "2",
    title: "Grabación del taller de diseño de API",
    description: "Sesión de taller sobre principios de diseño de API RESTful, autenticación y documentación.",
    type: "Vídeo",
    category: "Desarrollo",
    fileSize: "450 MB",
    duration: "2h 30min",
    accessType: "download",
    uploadedDate: "2024-10-12",
    tags: ["API", "Backend", "Diseño"]
  },
  {
    id: "3",
    title: "Cuaderno de habilidades de liderazgo",
    description: "Cuaderno interactivo con ejercicios y marcos para desarrollar capacidades de liderazgo.",
    type: "PDF",
    category: "Liderazgo",
    fileSize: "5.2 MB",
    duration: "1h 15min",
    accessType: "download",
    uploadedDate: "2024-10-08",
    tags: ["Liderazgo", "Gestión", "Habilidades"]
  },
  {
    id: "4",
    title: "Udemy - Curso avanzado de SQL",
    description: "Curso en línea completo sobre técnicas avanzadas de SQL, optimización y proyectos reales.",
    type: "Enlace",
    category: "Desarrollo",
    duration: "Curso de 12 h",
    accessType: "link",
    url: "https://udemy.com/advanced-sql",
    uploadedDate: "2024-10-05",
    tags: ["Base de datos", "SQL", "Curso en línea"]
  },
  {
    id: "5",
    title: "Presentación sobre metodología ágil",
    description: "Presentación sobre principios ágiles, marco Scrum y estrategias de implementación práctica.",
    type: "Presentación",
    category: "Gestión de proyectos",
    fileSize: "12 MB",
    duration: "30 min",
    accessType: "download",
    uploadedDate: "2024-09-28",
    tags: ["Ágil", "Scrum", "Metodología"]
  },
  {
    id: "6",
    title: "Certificado de diseño UX de Google",
    description: "Programa de certificación profesional sobre fundamentos de diseño UX, prototipado e investigación de usuarios.",
    type: "Enlace",
    category: "Diseño",
    duration: "6 meses",
    accessType: "link",
    url: "https://grow.google/ux-design",
    uploadedDate: "2024-09-25",
    tags: ["UX", "Diseño", "Certificado"]
  },
  {
    id: "7",
    title: "Centro de arquitectura de AWS",
    description: "Documentación oficial de AWS y buenas prácticas para arquitectura en la nube y patrones de diseño.",
    type: "Enlace",
    category: "Desarrollo",
    duration: "A tu ritmo",
    accessType: "link",
    url: "https://aws.amazon.com/architecture",
    uploadedDate: "2024-09-20",
    tags: ["Nube", "Arquitectura", "AWS"]
  },
  {
    id: "8",
    title: "Formación en habilidades de comunicación",
    description: "Guía práctica para mejorar la comunicación laboral, las habilidades de presentación y la resolución de conflictos.",
    type: "Documento",
    category: "Habilidades blandas",
    fileSize: "4.1 MB",
    duration: "1h 30min",
    accessType: "download",
    uploadedDate: "2024-09-15",
    tags: ["Comunicación", "Habilidades blandas", "Presentación"]
  },
  {
    id: "9",
    title: "Guías de seguridad OWASP",
    description: "Guías de seguridad estándar de la industria y buenas prácticas del Open Web Application Security Project.",
    type: "Enlace",
    category: "Seguridad",
    duration: "Referencia continua",
    accessType: "link",
    url: "https://owasp.org/www-project-top-ten",
    uploadedDate: "2024-09-10",
    tags: ["Seguridad", "Buenas prácticas", "OWASP"]
  },
  {
    id: "10",
    title: "LinkedIn Learning - Gestión de proyectos",
    description: "Curso completo de gestión de proyectos sobre planificación, ejecución y liderazgo de equipos.",
    type: "Enlace",
    category: "Gestión de proyectos",
    duration: "Curso de 8 h",
    accessType: "link",
    url: "https://linkedin.com/learning/project-management",
    uploadedDate: "2024-09-05",
    tags: ["Gestión de proyectos", "Liderazgo", "Curso en línea"]
  },
  {
    id: "11",
    title: "Guía de Docker y Kubernetes",
    description: "Guía completa de contenerización con Docker y orquestación con Kubernetes.",
    type: "PDF",
    category: "Desarrollo",
    fileSize: "6.3 MB",
    duration: "2 h de lectura",
    accessType: "download",
    uploadedDate: "2024-08-30",
    tags: ["Docker", "Kubernetes", "DevOps"]
  },
  {
    id: "12",
    title: "Coursera - Especialización en ciencia de datos",
    description: "Programa integral de ciencia de datos de la Universidad Johns Hopkins sobre R, estadística y aprendizaje automático.",
    type: "Enlace",
    category: "Ciencia de datos",
    duration: "11 meses",
    accessType: "link",
    url: "https://coursera.org/specializations/jhu-data-science",
    uploadedDate: "2024-08-25",
    tags: ["Ciencia de datos", "Aprendizaje automático", "Estadística"]
  }
]

// Resource Card Component
function ResourceCard({ resource }: { resource: typeof mockResources[0] }) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PDF: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "Vídeo": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Documento: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Presentación: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      Enlace: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const isLink = resource.accessType === "link"

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={getTypeColor(resource.type)} variant="secondary">
            {resource.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{resource.uploadedDate}</span>
        </div>
        <CardTitle className="text-xl line-clamp-2">{resource.title}</CardTitle>
        <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        <div className="flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          {resource.fileSize && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{resource.fileSize}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{resource.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLink ? (
              <>
                <ExternalLink className="w-4 h-4" />
                <span>Recurso externo</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Archivo descargable</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {isLink ? (
          <Button className="flex-1" variant="default" asChild>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir enlace
            </a>
          </Button>
        ) : (
          <>
            <Button className="flex-1" variant="default">
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button variant="outline">
              Vista previa
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

export default function TrainingResources() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading] = useState(false) // Mock loading state

  // Extract unique categories and types
  const categories = useMemo(() => {
    const uniqueCategories = new Set(mockResources.map(resource => resource.category))
    return Array.from(uniqueCategories).sort()
  }, [])

  const types = useMemo(() => {
    const uniqueTypes = new Set(mockResources.map(resource => resource.type))
    return Array.from(uniqueTypes).sort()
  }, [])

  // Filter resources
  const filteredResources = useMemo(() => {
    return mockResources.filter(resource => {
      // Filter by search term
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Filter by category
      const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
      
      // Filter by type
      const matchesType = selectedType === "all" || resource.type === selectedType
      
      return matchesSearch && matchesCategory && matchesType
    })
  }, [searchTerm, selectedCategory, selectedType])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Recursos de formación</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        
        {/* Filters Loading Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        
        {/* Resources Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recursos de formación</h1>
        <Button variant="default">
          <FileText className="w-4 h-4 mr-2" />
          Subir recurso
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredResources.length} de {mockResources.length} recursos
      </div>

      {/* Resource Cards */}
      {filteredResources.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se encontraron recursos</AlertTitle>
          <AlertDescription>
            Ajusta la búsqueda o los filtros para encontrar lo que necesitas.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  )
}