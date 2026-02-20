import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';

class InteractionClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('interaction-service');
  }

  async likePost(userId: string, postId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/interactions/like`,
      { userId, postId },
      { requestId } as any
    );
    return response.data.success;
  }

  async unlikePost(userId: string, postId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/interactions/unlike`,
      { userId, postId },
      { requestId } as any
    );
    return response.data.success;
  }

  async viewPost(userId: string, postId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/interactions/view`,
      { userId, postId },
      { requestId } as any
    );
    return response.data.success;
  }

  async commentPost(userId: string, postId: string, content: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.post(
      `${baseUrl}/interactions/comment`,
      { userId, postId, content },
      { requestId } as any
    );
    return response.data.success;
  }

  async getPostLikes(postId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.get(
      `${baseUrl}/interactions/likes/${postId}`,
      { requestId } as any
    );
    return response.data;
  }

  async getPostComments(postId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.get(
      `${baseUrl}/interactions/comments/${postId}`,
      { requestId } as any
    );
    return response.data;
  }

  async getMyInteractionHistory(userId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.get(
      `${baseUrl}/interactions/history/${userId}`,
      { requestId } as any
    );
    return response.data; // Returns { likedPostIds: string[], commentedPostIds: string[] }
  }

  async getUserInterests(userId: string, requestId?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await axiosInstance.get(
      `${baseUrl}/interactions/interests/${userId}`,
      { requestId } as any
    );
    return response.data;
  }
}

export const interactionClient = new InteractionClient();
