import axios from 'axios';
import { supabase } from './supabase';

// Connect to Cloudflare Worker backend
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Supabase session globally
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 responses — attempt token refresh, then redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      // Retry the original request with refreshed token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
