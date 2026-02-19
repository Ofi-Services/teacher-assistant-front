import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { baseApi } from "@/core/api/baseApi";
import { coursesApi } from "@/shared/store/coursesApi";
import { leaderApi } from "@/modules/leader/store/leaderApi";

type UserRole = "Talent" | "Leader" | "HR";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
  title?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveRoleFromIdentifier = (identifier: string): UserRole => {
  const normalized = identifier.toLowerCase();

  if (normalized.includes("leader") || normalized.includes("lead")) {
    return "Leader";
  }

  if (normalized.includes("hr") || normalized.includes("human")) {
    return "HR";
  }

  return "Talent";
};

const createMockUser = (identifier: string): User => {
  const role = resolveRoleFromIdentifier(identifier);

  return {
    id: identifier || "mock-user-1",
    name: role === "Leader" ? "Alex Leader" : role === "HR" ? "Hanna HR" : "Taylor Talent",
    email: identifier.includes("@") ? identifier : `${role.toLowerCase()}@ofi.mock`,
    role,
    region: role === "HR" ? "Global" : "LATAM",
    title: role === "Leader" ? "Team Lead" : role === "HR" ? "HR Specialist" : "Consultant",
    avatar: "/default-avatar.png",
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSamlCallback = useCallback(async (accessToken: string, refreshToken: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem("ofi_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("ofi_refresh_token", refreshToken);
      }

      await wait(300);
      const userData = createMockUser(accessToken || "talent@ofi.mock");

      setUser(userData);
      localStorage.setItem("ofi_user", JSON.stringify(userData));

      // Remove tokens from URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Navigate based on role
      if (userData.role === "Talent") {
        navigate("/courses");
      } else if (userData.role === "Leader") {
        navigate("/leader/dashboard");
      } else if (userData.role === "HR") {
        navigate("/hr/dashboard");
      } else {
        navigate("/courses");
      }
    } catch (error) {
      console.error("[AuthProvider] SAML callback error:", error);
      localStorage.removeItem("ofi_token");
      localStorage.removeItem("ofi_refresh_token");
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Check for SAML callback tokens in URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access");
    const refreshToken = urlParams.get("refresh");

    if (accessToken && refreshToken) {
      console.log("[AuthProvider] SAML tokens detected in URL");
      // Handle SAML callback
      handleSamlCallback(accessToken, refreshToken);
      return;
    }

    // Check for stored user
    const storedUser = localStorage.getItem("ofi_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("[AuthProvider] Error parsing stored user:", error);
        localStorage.removeItem("ofi_user");
      }
    }
    setIsLoading(false);
  }, [handleSamlCallback]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await wait(300);

      if (!username && !password) {
        return false;
      }

      const userData = createMockUser(username || "talent@ofi.mock");
      const token = `mock-token-${userData.role.toLowerCase()}-${Date.now()}`;

      setUser(userData);
      localStorage.setItem("ofi_user", JSON.stringify(userData));
      localStorage.setItem("ofi_token", token);

      if (userData.role === "Talent") {
        navigate("/courses");
      } else if (userData.role === "Leader") {
        navigate("/leader/dashboard");
      } else if (userData.role === "HR") {
        navigate("/hr/dashboard");
      }

      return true;
    } catch (error) {
      console.error("[AuthProvider] Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ofi_user");
    localStorage.removeItem("ofi_token");
    
    dispatch(baseApi.util.resetApiState());
    dispatch(coursesApi.util.resetApiState());
    dispatch(leaderApi.util.resetApiState());
    
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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