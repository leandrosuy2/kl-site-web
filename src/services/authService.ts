import api from '@/lib/api';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse,
} from '@/types/auth';

export const authService = {
  /**
   * Realiza login do usuário
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      
      // Salvar token e dados do usuário
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  },

  /**
   * Realiza cadastro de novo usuário
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      
      // Salvar token e dados do usuário
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  },

  /**
   * Solicita recuperação de senha
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/forgot-password', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  },

  /**
   * Verifica se o usuário está autenticado e renova o token
   */
  /**
   * Atualiza nome e e-mail do usuário autenticado
   */
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    try {
      const response = await api.patch<AuthResponse>('/auth/profile', data);
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  },

  /**
   * Altera a senha (usuário já autenticado)
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await api.post('/auth/change-password', data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  },

  async me(): Promise<AuthResponse> {
    try {
      const response = await api.get<AuthResponse>('/auth/me');
      
      // Atualizar token se vier um novo
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  },

  /**
   * Realiza logout do usuário
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  /**
   * Retorna o usuário autenticado
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Tratamento de erros da API
   */
  handleError(error: any): Error {
    if (error.response) {
      // Erro retornado pela API
      const message = error.response.data?.message || 'Erro ao processar requisição';
      return new Error(message);
    } else if (error.request) {
      // Requisição feita mas sem resposta
      return new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
    } else {
      // Erro na configuração da requisição
      return new Error('Erro ao configurar requisição');
    }
  }
};
