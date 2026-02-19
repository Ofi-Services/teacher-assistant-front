
import { StatusConfig } from "../types"

export const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case "excellent":
      return {
        variant: "default" as const,
        label: "Excelente",
        className: "bg-green-500 hover:bg-green-600"
      }
    case "on_track":
      return {
        variant: "secondary" as const,
        label: "En curso",
        className: ""
      }
    default:
      return {
        variant: "destructive" as const,
        label: "En riesgo",
        className: ""
      }
  }
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
}