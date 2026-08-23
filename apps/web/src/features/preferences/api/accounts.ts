import api from '@/lib/api';
import type { Account, AccountsResponse } from '@/types/api';

export type UpdateAccountInput = {
  id: number;
  name?: string;
  type?: Account['type'];
  balance?: number;
};

export async function getAccounts(): Promise<AccountsResponse> {
  const { data } = await api.get<AccountsResponse>('/accounts');
  return data;
}

export async function createAccount(input: Omit<Account, 'id'>) {
  const { data } = await api.post('/accounts', input);
  return data;
}

export async function updateAccount({ id, ...input }: UpdateAccountInput) {
  const { data } = await api.put(`/accounts/${id}`, input);
  return data;
}

export async function deleteAccount(id: number) {
  const { data } = await api.delete(`/accounts/${id}`);
  return data;
}
