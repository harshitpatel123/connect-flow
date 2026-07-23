import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';
import { handleServiceError } from './serviceError';

class AuthClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('auth-service');
  }

  async register(email: string, password: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/auth/register`, { email, password }, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'register'); }
  }

  async login(email: string, password: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/auth/login`, { email, password }, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'login'); }
  }

  async getUserById(userId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.get(`${baseUrl}/auth/user/${userId}`, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getUserById'); }
  }

  async validateToken(token: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/auth/validate`, { token }, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'validateToken'); }
  }

  async getUsersByIds(userIds: string[], requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/auth/users/batch`, { ids: userIds }, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getUsersByIds'); }
  }

  async hashPassword(password: string, requestId?: string): Promise<string> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/auth/hash-password`, { password }, { requestId } as any);
      return response.data.hash;
    } catch (e) { handleServiceError(e, 'hashPassword'); }
  }
}

export const authClient = new AuthClient();
