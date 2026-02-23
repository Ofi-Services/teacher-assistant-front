import { Route } from "react-router-dom"
import RoleRoute from "@/core/routes/RoleRoute"
import DirectorDashboardView from "@/modules/teacher-assistant/pages/DirectorDashboardView"
import TeacherDashboardView from "@/modules/teacher-assistant/pages/TeacherDashboardView"
import PlanListView from "@/modules/teacher-assistant/pages/PlanListView"
import PlanCreateEditView from "@/modules/teacher-assistant/pages/PlanCreateEditView"
import AssignmentManagementView from "@/modules/teacher-assistant/pages/AssignmentManagementView"
import AssignmentDetailView from "@/modules/teacher-assistant/pages/AssignmentDetailView"
import AlertsRecommendationsView from "@/modules/teacher-assistant/pages/AlertsRecommendationsView"
import TeacherPlanListView from "@/modules/teacher-assistant/pages/TeacherPlanListView"
import CoursesManagementView from "@/shared/components/common/CoursesManagementView"
import VoiceChat from "@/modules/consultant/pages/chatbot"

export const teacherAssistantRoutes = (
  <>
    <Route
      path="/director/dashboard"
      element={
        <RoleRoute allowedRoles={["director"]}>
          <DirectorDashboardView />
        </RoleRoute>
      }
    />
    <Route
      path="/director/plans"
      element={
        <RoleRoute allowedRoles={["director"]}>
          <PlanListView />
        </RoleRoute>
      }
    />
    <Route
      path="/director/plans/new"
      element={
        <RoleRoute allowedRoles={["director"]}>
          <PlanCreateEditView />
        </RoleRoute>
      }
    />
    <Route
      path="/director/assignments"
      element={
        <RoleRoute allowedRoles={["director"]}>
          <AssignmentManagementView />
        </RoleRoute>
      }
    />
    <Route
      path="/director/alerts"
      element={
        <RoleRoute allowedRoles={["director"]}>
          <AlertsRecommendationsView />
        </RoleRoute>
      }
    />

    <Route
      path="/teacher/dashboard"
      element={
        <RoleRoute allowedRoles={["teacher"]}>
          <TeacherDashboardView />
        </RoleRoute>
      }
    />
    <Route
      path="/teacher/plans"
      element={
        <RoleRoute allowedRoles={["teacher"]}>
          <TeacherPlanListView />
        </RoleRoute>
      }
    />
    <Route
      path="/courses"
      element={
        <RoleRoute allowedRoles={["teacher"]}>
          <CoursesManagementView />
        </RoleRoute>
      }
    />
    <Route
      path="/teacher/assignments/:id"
      element={
        <RoleRoute allowedRoles={["director", "teacher"]}>
          <AssignmentDetailView />
        </RoleRoute>
      }
    />
    <Route
      path="/chatbot"
      element={
        <RoleRoute allowedRoles={["director", "teacher"]}>
          <VoiceChat agentId={import.meta.env.VITE_ELEVENLABS_AGENT_ID || ""} />
        </RoleRoute>
      }
    />
  </>
)
