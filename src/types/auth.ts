export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

/** Atualização de perfil (endpoint esperado: PATCH /auth/profile) */
export interface UpdateProfileRequest {
  nome: string;
  email: string;
}

/** Troca de senha logada (endpoint esperado: POST /auth/change-password) */
export interface ChangePasswordRequest {
  senha_atual: string;
  senha_nova: string;
}

export interface AuthResponse {
  access_token?: string;
  token?: string;
  user?: {
    id: number;
    nome: string;
    email: string;
  };
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
