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

export default api;
