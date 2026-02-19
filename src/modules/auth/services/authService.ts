// src/services/authService.ts

// Definición de tipos
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * Servicio de autenticación que gestiona las operaciones relacionadas con login y registro
 */
class AuthService {
  private readonly wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

  private buildMockAuthResponse(email: string, firstName?: string, lastName?: string): AuthResponse {
    const role = email.toLowerCase().includes('leader')
      ? 'Leader'
      : email.toLowerCase().includes('hr')
      ? 'HR'
      : 'Talent';

    return {
      user: {
        id: `mock-${Date.now()}`,
        email,
        firstName: firstName || 'Mock',
        lastName: lastName || 'User',
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      tokens: {
        token: `mock-token-${role.toLowerCase()}-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
        expiresIn: 3600,
      },
    };
  }

  /**
   * Inicia sesión con las credenciales proporcionadas
   * @param credentials Credenciales de inicio de sesión
   * @returns Respuesta con datos del usuario y tokens
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.wait();
    return this.buildMockAuthResponse(credentials.email);
  }

  /**
   * Registra un nuevo usuario
   * @param userData Datos del nuevo usuario
   * @returns Respuesta con datos del usuario y tokens
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    await this.wait();
    return this.buildMockAuthResponse(userData.email, userData.firstName, userData.lastName);
  }

  /**
   * Verifica si hay un token de autenticación almacenado
   * @returns true si existe un token, false en caso contrario
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export const authService = new AuthService();