import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';

class FeedClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('feed-service');
  }

  async getMyFeed(userId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.get(
      `${baseUrl}/feed/${userId}`,
      { requestId } as any
    );
    return response.data;
  }

  async regenerateFeed(userId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/feed/regenerate`,
      { userId },
      { requestId } as any
    );
    return response.data;
  }
}

export const feedClient = new FeedClient();
