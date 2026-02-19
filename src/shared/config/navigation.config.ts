import { BookOpen, Calendar, HelpCircle, Settings, Users2, Target, MessageSquare } from "lucide-react"
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

export const CONSULTANT_NAV: NavSection[] = [
  {
    title: "Menú principal",
    items: [
      { label: "Gestión de cursos", icon: BookOpen, path: "/courses", active: true },
      { label: "Calendario de formación", icon: Calendar, path: "/schedule" },
      { label: "Vista de profe", icon: Users2, path: "/leader/dashboard" },
      { label: "Calendario de profe", icon: Target, path: "/leader/plans" },
      //{ label: "Course Resources", icon: BookOpen, path: "/resources" },
    ],
  },
  {
    title: "Enlaces rápidos",
    items: [
      { label: "Habla con Sofia", icon: MessageSquare, path: "/chatbot" },
      { label: "Chat", icon: MessageSquare, path: "https://teams.microsoft.com/v2/" },
      //{ label: "Discussion Forums", icon: MessageSquare, path: "/forums" },
      //{ label: "Help & Support", icon: HelpCircle, path: "/support" },
      //{ label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
]

export const LEADER_NAV: NavSection[] = [
  {
    title: "Menú principal",
    items: [
      { label: "Gestión de cursos", icon: BookOpen, path: "/courses", active: true },
      { label: "Resumen del equipo", icon: Users2, path: "/leader/dashboard" },
      //{ label: "Performance Reports", icon: BarChart3, path: "/leader/reports" },
      { label: "Calendario", icon: Target, path: "/leader/plans" },
      //{ label: "Certificates", icon: Award, path: "/leader/certificates" },
    ],
  },
  {
    title: "Enlaces rápidos",
    items: [
      { label: "Chat", icon: MessageSquare, path: "https://teams.microsoft.com/v2/" },
      //{ label: "Team Messages", icon: MessageSquare, path: "/leader/messages" },
      //{ label: "Resources", icon: FileText, path: "/leader/resources" },
      //{ label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
]

export const HR_NAV: NavSection[] = [
  {
    title: "RR. HH.",
    items: [
      { label: "Gestión de cursos", icon: BookOpen, path: "/courses", active: true },
      { label: "Resumen del equipo", icon: Users2, path: "/hr/dashboard" },
      { label: "Vista de líder", icon: Users2, path: "/leader/dashboard" },
      //{ label: "Performance Reports", icon: BarChart3, path: "/leader/reports" },
      { label: "Calendario", icon: Target, path: "/hr/plans" },
      { label: "Calendario de líder", icon: Target, path: "/leader/plans" },
      //{ label: "Certificates", icon: Award, path: "/leader/certificates" },
    ],
  },
  {
    title: "Enlaces rápidos",
    items: [
      { label: "Configuración del sistema", icon: Settings, path: "/superuser/settings" },
      { label: "Ayuda y soporte", icon: HelpCircle, path: "/support" },
      { label: "Chat", icon: MessageSquare, path: "https://teams.microsoft.com/v2/" },
    ],
  },
]