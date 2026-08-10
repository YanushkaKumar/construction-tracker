import axios from 'axios';
import { useAuthStore } from '../store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:4000/api/v1');

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for refresh token rotation
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if unauthorized and request was not already retried
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const currentStore = useAuthStore.getState();
        const refreshToken = currentStore.refreshToken;
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true }
        );
        
        const { accessToken, refreshToken: rotatedRefreshToken } = response.data;
        if (accessToken) {
          // The API rotates refresh tokens: the one we just sent is now revoked,
          // so the new one must be persisted or the next refresh will fail.
          if (currentStore.user && currentStore.company) {
            currentStore.setAuth(
              currentStore.user,
              currentStore.company,
              accessToken,
              rotatedRefreshToken ?? refreshToken ?? undefined,
            );
          }
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Clear auth and redirect
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
