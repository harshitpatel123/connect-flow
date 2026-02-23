import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';

class PostClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('post-service');
  }

  async createPost(userId: string, content: string, categoryTags: string[], requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/posts`,
      { userId, content, categoryTags },
      { requestId } as any
    );
    return response.data;
  }

  async getMyPosts(userId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.get(
      `${baseUrl}/posts/user/${userId}`,
      { requestId } as any
    );
    return response.data;
  }

  async getPostsByIds(postIds: string[], requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/posts/batch`,
      { ids: postIds },
      { requestId } as any
    );
    return response.data;
  }
}

export const postClient = new PostClient();
