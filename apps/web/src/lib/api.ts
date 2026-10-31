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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Concurrent 401s share one refresh so Supabase's refresh token is only rotated once
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken() {
  refreshPromise ??= supabase.auth
    .refreshSession()
    .then(({ data, error }) =>
      error ? null : (data.session?.access_token ?? null),
    )
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

// Handle 401 responses — attempt token refresh once, then redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(error);
    }

    const accessToken = await refreshAccessToken();
    if (!accessToken) {
      await supabase.auth.signOut();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    config._retried = true;
    config.headers.Authorization = `Bearer ${accessToken}`;
    return api.request(config);
  },
);

export default api;
