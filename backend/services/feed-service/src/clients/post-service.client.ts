import axios from 'axios';
import { Post } from '../domain/types.js';
import { getServiceUrl } from '../config/consul.js';
import { tracer } from '../config/jaeger.js';
import { FORMAT_HTTP_HEADERS } from 'opentracing';

export class PostServiceClient {
  private async getBaseUrl(): Promise<string> {
    return getServiceUrl('post-service');
  }

  async getPostsByIds(ids: string[], parentSpan?: any): Promise<Post[]> {
    const span = tracer.startSpan('post-service.getPostsByIds', { childOf: parentSpan });
    span.setTag('post.ids.count', ids.length);
    
    try {
      const baseUrl = await this.getBaseUrl();
      const headers: any = {};
      tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
      
      const response = await axios.post(`${baseUrl}/posts/batch`, { ids }, { headers });
      span.setTag('http.status_code', response.status);
      return response.data;
    } catch (error: any) {
      span.setTag('error', true);
      span.log({ event: 'error', message: error.message });
      console.error('Failed to fetch posts:', error);
      return [];
    } finally {
      span.finish();
    }
  }

  async getPostById(id: string, parentSpan?: any): Promise<Post | null> {
    const span = tracer.startSpan('post-service.getPostById', { childOf: parentSpan });
    span.setTag('post.id', id);
    
    try {
      const baseUrl = await this.getBaseUrl();
      const headers: any = {};
      tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
      
      const response = await axios.get(`${baseUrl}/posts/${id}`, { headers });
      span.setTag('http.status_code', response.status);
      return response.data;
    } catch (error: any) {
      span.setTag('error', true);
      span.log({ event: 'error', message: error.message });
      console.error('Failed to fetch post:', error);
      return null;
    } finally {
      span.finish();
    }
  }

  async getRecentPosts(limit: number, parentSpan?: any): Promise<Post[]> {
    const span = tracer.startSpan('post-service.getRecentPosts', { childOf: parentSpan });
    span.setTag('limit', limit);
    
    try {
      const baseUrl = await this.getBaseUrl();
      const headers: any = {};
      tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
      
      const response = await axios.get(`${baseUrl}/posts/recent/${limit}`, { headers });
      span.setTag('http.status_code', response.status);
      span.setTag('posts.count', response.data.length);
      return response.data;
    } catch (error: any) {
      span.setTag('error', true);
      span.log({ event: 'error', message: error.message });
      console.error('Failed to fetch recent posts:', error);
      return [];
    } finally {
      span.finish();
    }
  }
}

export const postServiceClient = new PostServiceClient();
