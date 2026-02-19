import { Route } from "react-router-dom";
import RoleRoute from "@/core/routes/RoleRoute";
import TrainingCalendar from "@/shared/components/common/calendar/CalendarSummary";
import TrainingResources from "../pages/TrainingResoursesPage";
import WorkInProgress from "@/shared/components/common/WorkInProgressPage";
import VoiceChat from "../pages/chatbot";

const role = ["Talent"]; // 👈 Define el rol aquí una sola vez

const Schedule = () => <TrainingCalendar />;
const Resources = () => <TrainingResources />;
const Forums = () => <WorkInProgress />;
const Chatbot = () => <VoiceChat agentId={import.meta.env.VITE_ELEVENLABS_AGENT_ID || ""} />;

export const consultantRoutes = (
  <>
    <Route
      path="/schedule"
      element={
        <RoleRoute allowedRoles={role}>
          <Schedule />
        </RoleRoute>
      }
    />

    <Route
      path="/resources"
      element={
        <RoleRoute allowedRoles={role}>
          <Resources />
        </RoleRoute>
      }
    />

    <Route
      path="/forums"
      element={
        <RoleRoute allowedRoles={role}>
          <Forums />
        </RoleRoute>
      }
    />

    <Route
      path="/chatbot"
      element={
        <RoleRoute allowedRoles={role}>
          <Chatbot />
        </RoleRoute>
      }
    />
  </>
);
