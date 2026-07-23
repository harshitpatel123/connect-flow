import { axiosInstance } from '../config/axios';
import { getServiceUrl } from '../config/consul';
import { handleServiceError } from './serviceError';

class InteractionClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('interaction-service');
  }

  async likePost(userId: string, postId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/interactions/like`, { userId, postId }, { requestId } as any);
      return response.data.success;
    } catch (e) { handleServiceError(e, 'likePost'); }
  }

  async unlikePost(userId: string, postId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/interactions/unlike`, { userId, postId }, { requestId } as any);
      return response.data.success;
    } catch (e) { handleServiceError(e, 'unlikePost'); }
  }

  async viewPost(userId: string, postId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/interactions/view`, { userId, postId }, { requestId } as any);
      return response.data.success;
    } catch (e) { handleServiceError(e, 'viewPost'); }
  }

  async commentPost(userId: string, postId: string, content: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.post(`${baseUrl}/interactions/comment`, { userId, postId, content }, { requestId } as any);
      return response.data.success;
    } catch (e) { handleServiceError(e, 'commentPost'); }
  }

  async getPostLikes(postId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.get(`${baseUrl}/interactions/likes/${postId}`, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getPostLikes'); }
  }

  async getPostComments(postId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.get(`${baseUrl}/interactions/comments/${postId}`, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getPostComments'); }
  }

  async getMyInteractionHistory(userId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.get(`${baseUrl}/interactions/history/${userId}`, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getMyInteractionHistory'); }
  }

  async getUserInterests(userId: string, requestId?: string) {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axiosInstance.get(`${baseUrl}/interactions/interests/${userId}`, { requestId } as any);
      return response.data;
    } catch (e) { handleServiceError(e, 'getUserInterests'); }
  }
}

export const interactionClient = new InteractionClient();
