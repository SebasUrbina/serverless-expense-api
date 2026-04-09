import axios from 'axios';
import { supabase } from './supabase';

// Connect to the local Cloudflare Worker backend
export const api = axios.create({
  baseURL: 'http://127.0.0.1:8787/api',
  // baseURL: 'https://expense-api.sebastian-urbina97.workers.dev/api',
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

export default api;
