import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Permite cookies (refresh token)
});

// Separate client used only for auth refresh to avoid interceptor recursion
const refreshClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
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

// Interceptor para lidar com erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro é 401 e não é uma retry, tenta fazer refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // mark to avoid infinite loop
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshClient
          .post('/auth/refresh')
          .then((res) => {
            const accessToken = res.data?.data?.accessToken;
            if (accessToken) {
              useAuthStore.getState().setAuth(useAuthStore.getState().user!, accessToken);
              onRefreshed(accessToken);
              return accessToken;
            }
            onRefreshed(null);
            return null;
          })
          .catch((err) => {
            onRefreshed(null);
            return null;
          })
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          } else {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
            reject(error);
          }
        });
      });
    }

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
);

