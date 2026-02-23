import { Routes, Route, Navigate } from "react-router-dom"
import Login from "@/modules/auth/pages/Index"
import NotFound from "@/shared/components/common/NotFound"
import { teacherAssistantRoutes } from "@/modules/teacher-assistant/routes/teacherAssistant.routes"

/**
 * Main Application Routes
 * 
 * Routes are organized by modules:
 * - Consultant routes: /dashboard, /schedule, /resources, /forums
 * - Leader routes: /leader/*
 * - Superuser routes: /superuser/*
 * - Shared routes: /support, /settings (all authenticated users)
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {teacherAssistantRoutes}

      {/* Catch all - 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}