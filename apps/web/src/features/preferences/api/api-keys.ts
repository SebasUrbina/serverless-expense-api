import api from '@/lib/api';
import type { ApiKeyResponse } from '@/types/api';

export async function getApiKey(): Promise<ApiKeyResponse> {
  const { data } = await api.get<ApiKeyResponse>('/keys');
  return data;
}

export async function generateApiKey(): Promise<ApiKeyResponse> {
  const { data } = await api.post<ApiKeyResponse>('/keys');
  return data;
}
