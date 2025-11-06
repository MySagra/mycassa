import { useCallback } from 'react';
import apiClient from '@/lib/api-client';
import type { LoginRequest, LoginResponse } from '@/lib/api-types';

/**
 * Custom hook for authentication API calls
 * Uses the configured apiClient with automatic token refresh
 */
export function useAuthApi() {
  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  }, []);

  const refreshToken = useCallback(async (): Promise<string> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data.accessToken;
  }, []);

  return {
    login,
    logout,
    refreshToken,
  };
}

/**
 * Generic hook for making authenticated API calls
 * Automatically includes authorization headers
 */
export function useApi() {
  const get = useCallback(async <T,>(url: string, params?: Record<string, any>): Promise<T> => {
    const response = await apiClient.get<T>(url, { params });
    return response.data;
  }, []);

  const post = useCallback(async <T,>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  }, []);

  const put = useCallback(async <T,>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.put<T>(url, data);
    return response.data;
  }, []);

  const patch = useCallback(async <T,>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.patch<T>(url, data);
    return response.data;
  }, []);

  const del = useCallback(async <T,>(url: string): Promise<T> => {
    const response = await apiClient.delete<T>(url);
    return response.data;
  }, []);

  return {
    get,
    post,
    put,
    patch,
    delete: del,
  };
}
