import axios from 'axios';
import { UserInterest } from '../domain/types.js';
import { getServiceUrl } from '../config/consul.js';

export class InteractionServiceClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('interaction-service');
  }

  async getUserInterests(userId: string): Promise<UserInterest[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.get(`${baseUrl}/interactions/interests/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user interests:', error);
      return [];
    }
  }

  async getQualifiedUsers(categories: string[], minScore: number): Promise<{ userId: string; maxAffinity: number }[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.post(`${baseUrl}/interactions/interests/qualified-users`, {
        categories,
        minScore
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch qualified users:', error);
      return [];
    }
  }
}

export const interactionServiceClient = new InteractionServiceClient();
