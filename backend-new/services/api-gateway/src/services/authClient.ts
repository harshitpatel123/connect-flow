import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';

class AuthClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('auth-service');
  }

  async register(email: string, password: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/auth/register`,
      { email, password },
      { requestId } as any
    );
    return response.data;
  }

  async login(email: string, password: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/auth/login`,
      { email, password },
      { requestId } as any
    );
    return response.data;
  }

  async getUserById(userId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.get(
      `${baseUrl}/auth/user/${userId}`,
      { requestId } as any
    );
    return response.data;
  }

  async validateToken(token: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/auth/validate`,
      { token },
      { requestId } as any
    );
    return response.data;
  }
}

export const authClient = new AuthClient();
