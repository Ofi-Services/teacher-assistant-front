
import { Route } from "react-router-dom"
import ProtectedRoute from "@/core/routes/ProtectedRoute"
import AuthenticatedLayout from "../components/common/AuthenticatedLayout"
import CoursesManagementView from "../components/common/CoursesManagementView"
import WorkInProgress from "../components/common/WorkInProgressPage"

// Shared pages (accessible by all authenticated users)
const Support = () => <WorkInProgress />
const Settings = () => <WorkInProgress />

/**
 * Shared Routes
 * Routes accessible by all authenticated users regardless of role
 */
export const sharedRoutes = (
  <>
    <Route
      path="/courses"
      element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <CoursesManagementView />
          </AuthenticatedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/support"
      element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Support />
          </AuthenticatedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedRoute>
      }
    />
  </>
)