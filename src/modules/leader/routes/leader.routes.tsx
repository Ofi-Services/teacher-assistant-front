import { Route } from "react-router-dom";
import RoleRoute from "@/core/routes/RoleRoute";
import LeaderDashboard from "../pages/LeaderPage";
import TrainingCalendar from "@/shared/components/common/calendar/CalendarSummary";

const role: string[] = [];

const leaderPages = [
  { path: "/leader/dashboard", element: <LeaderDashboard /> },
  { path: "/leader/reports", element: <div>Página de reportes del líder</div> },
  { path: "/leader/plans", element: < TrainingCalendar /> },
  { path: "/leader/certificates", element: <div>Página de certificados del líder</div> },
  { path: "/leader/messages", element: <div>Página de mensajes del líder</div> },
  { path: "/leader/resources", element: <div>Página de recursos del líder</div> },
];

export const leaderRoutes = leaderPages.map(({ path, element }) => (
  <Route key={path} path={path} element={<RoleRoute allowedRoles={role}>{element}</RoleRoute>} />
));
