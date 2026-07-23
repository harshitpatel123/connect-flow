import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';
import { handleServiceError } from './serviceError';

class FeedClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('feed-service');
  }

  async getMyFeed(userId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.get(`${baseUrl}/feed/${userId}`, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getMyFeed'); }
  }

  async regenerateFeed(userId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/feed/${userId}/regenerate`, {}, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'regenerateFeed'); }
  }
}

export const feedClient = new FeedClient();
