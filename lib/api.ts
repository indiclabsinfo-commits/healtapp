import axios, { AxiosResponse } from "axios";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Standard API wrapper shape returned by every Express endpoint:
 *   success endpoints → { success: true, data, pagination? }
 *   error endpoints   → { success: false, error, code }
 *
 * Convention:
 *   - lib/* wrappers (recommended): always `return response.data` so callers see
 *     `{ success, data, pagination? }` and access the payload via `.data`.
 *   - Raw `api.get(...)` calls: response is AxiosResponse — payload is `response.data.data`.
 *     Use the `unwrap()` helper below to get the payload directly without confusion.
 */
export type ApiWrapper<T> = {
  success: boolean;
  data: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: string;
  code?: string;
};

/** Extract the inner `.data` payload from a raw axios call. Avoids `.data.data` confusion. */
export async function unwrap<T = any>(p: Promise<AxiosResponse<ApiWrapper<T>>>): Promise<T> {
  const res = await p;
  return res.data?.data as T;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/auth/refresh`,
          { refreshToken }
        );

        useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
