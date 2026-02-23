import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 5000; // 5 seconds

// Create axios instance with default config
export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add request ID
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Propagate request ID if available
      const requestId = (config as any).requestId;
      if (requestId) {
        config.headers['x-request-id'] = requestId;
      }
      
      console.log(`[${requestId || 'N/A'}] --> ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - Log and handle errors
  instance.interceptors.response.use(
    (response) => {
      const requestId = response.config.headers['x-request-id'];
      console.log(`[${requestId || 'N/A'}] <-- ${response.status} ${response.config.url}`);
      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as any;
      const requestId = config?.headers['x-request-id'];

      // Initialize retry count
      config.retryCount = config.retryCount || 0;

      // Retry logic for network errors or 5xx errors
      const shouldRetry =
        config.retryCount < MAX_RETRIES &&
        (!error.response || (error.response.status >= 500 && error.response.status < 600));

      if (shouldRetry) {
        config.retryCount += 1;
        console.warn(
          `[${requestId || 'N/A'}] Retry ${config.retryCount}/${MAX_RETRIES} for ${config.url}`
        );

        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, config.retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return instance(config);
      }

      console.error(`[${requestId || 'N/A'}] Request failed: ${error.message}`);
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export singleton instance
export const axiosInstance = createAxiosInstance();
