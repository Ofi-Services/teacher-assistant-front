import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  clearTokens,
  setTokens,
  teacherAssistantApi,
} from "@/modules/teacher-assistant/api/teacherAssistantApi";
import { User } from "@/modules/teacher-assistant/types";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  reloadProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const redirectByRole = (role: User["role"]) => {
    navigate(role === "director" ? "/director/dashboard" : "/teacher/dashboard");
  };

  const reloadProfile = async () => {
    const profile = await teacherAssistantApi.getProfile();
    setUser(profile);
    localStorage.setItem("ta_user", JSON.stringify(profile));
  };

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem("ta_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as User);
        } catch {
          localStorage.removeItem("ta_user");
        }
      }

      try {
        await reloadProfile();
      } catch {
        clearTokens();
        localStorage.removeItem("ta_user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);

    try {
      const tokens = await teacherAssistantApi.login(username, password);
      if (!tokens.access || !tokens.refresh) {
        return false;
      }

      setTokens(tokens.access, tokens.refresh);
      const profile = await teacherAssistantApi.getProfile();

      setUser(profile);
      localStorage.setItem("ta_user", JSON.stringify(profile));
      redirectByRole(profile.role);

      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearTokens();
    localStorage.removeItem("ta_user");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, reloadProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}