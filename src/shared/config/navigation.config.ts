import { BookOpen, Bell, ClipboardList, Home, MessageSquare } from "lucide-react"
import { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  icon: LucideIcon
  path: string
  active?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const DIRECTOR_NAV: NavSection[] = [
  {
    title: "Director",
    items: [
      { label: "Dashboard", icon: Home, path: "/director/dashboard", active: true },
      { label: "Planes", icon: BookOpen, path: "/director/plans" },
      { label: "Asignaciones", icon: ClipboardList, path: "/director/assignments" },
      { label: "Alertas", icon: Bell, path: "/director/alerts" },
      { label: "Interactuar", icon: MessageSquare, path: "/chatbot" },
    ],
  },
]

export const TEACHER_NAV: NavSection[] = [
  {
    title: "Teacher",
    items: [
      { label: "Dashboard", icon: Home, path: "/teacher/dashboard", active: true },
      { label: "Gestión de cursos", icon: BookOpen, path: "/courses" },
      { label: "Mis planes", icon: BookOpen, path: "/teacher/plans" },
      { label: "Interactuar", icon: MessageSquare, path: "/chatbot" },
    ],
  },
]