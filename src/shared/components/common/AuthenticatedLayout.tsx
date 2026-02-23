
import { ReactNode } from "react"
import { useAuth } from "@/shared/hooks/use-auth"
import DashboardLayout from "./DashboardLayout"
import { DIRECTOR_NAV, TEACHER_NAV } from "@/shared/config/navigation.config"

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  // Selecciona el navigation según el rol del usuario
  let navigation
  switch (user.role) {
    case "director":
      navigation = DIRECTOR_NAV
      break
    case "teacher":
      navigation = TEACHER_NAV
      break
    default:
      navigation = TEACHER_NAV
  }

  return (
    <DashboardLayout navigation={navigation} onLogout={logout}>
      {children}
    </DashboardLayout>
  )
}