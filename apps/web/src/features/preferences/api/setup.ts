import api from '@/lib/api';
import type { UserSetupResponse } from '@/types/api';

export async function setupUser(): Promise<UserSetupResponse> {
  const { data } = await api.post<UserSetupResponse>('/user/setup');
  return data;
}
