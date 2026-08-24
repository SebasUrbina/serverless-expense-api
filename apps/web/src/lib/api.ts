import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: ReturnType<typeof supabase.auth.refreshSession> | null = null;

// Connect to Cloudflare Worker backend
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Supabase session globally
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 responses — attempt token refresh, then redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && config && !config._retry) {
      config._retry = true;
      refreshPromise ??= supabase.auth.refreshSession().finally(() => {
        refreshPromise = null;
      });

      const { data, error: refreshError } = await refreshPromise;
      if (refreshError || !data.session) {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
        return Promise.reject(error);
      }

      config.headers.Authorization = `Bearer ${data.session.access_token}`;
      return api.request(config);
    }
    return Promise.reject(error);
  },
);

export default api;
