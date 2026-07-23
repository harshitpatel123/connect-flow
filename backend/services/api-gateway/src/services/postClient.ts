import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';
import { handleServiceError } from './serviceError';

class PostClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('post-service');
  }

  async createPost(userId: string, content: string, categoryTags: string[], requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/posts`, { userId, content, categoryTags }, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'createPost'); }
  }

  async getMyPosts(userId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.get(`${baseUrl}/posts/user/${userId}`, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getMyPosts'); }
  }

  async getPostsByIds(postIds: string[], requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/posts/batch`, { ids: postIds }, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getPostsByIds'); }
  }
}

export const postClient = new PostClient();
