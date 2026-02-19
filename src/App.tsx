import "./global.css";

import { Toaster } from "./shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./shared/store/store";
import { AuthProvider } from "./shared/hooks/use-auth";
import { ThemeProvider } from "next-themes";
import AppRoutes from "./core/routes/AppRoutes";
import VoiceChat from "./modules/consultant/pages/chatbot";

export const App = () => (
  <Provider store={store}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <VoiceChat agentId={import.meta.env.VITE_ELEVENLABS_AGENT_ID || ""} />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </Provider>
);
