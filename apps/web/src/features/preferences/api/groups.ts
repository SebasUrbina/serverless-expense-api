import api from '@/lib/api';
import type { GroupsResponse } from '@/types/api';

export type CreateGroupInput = { name: string; nickname: string };
export type JoinGroupInput = { invite_code: string; nickname: string };
export type UpdateGroupInput = { id: number; name: string };

export async function getGroups(): Promise<GroupsResponse> {
  const { data } = await api.get<GroupsResponse>('/groups');
  return data;
}

export async function createGroup(input: CreateGroupInput) {
  const { data } = await api.post('/groups', input);
  return data;
}

export async function joinGroup(input: JoinGroupInput) {
  const { data } = await api.post('/groups/join', input);
  return data;
}

export async function updateGroup({ id, name }: UpdateGroupInput) {
  const { data } = await api.put(`/groups/${id}`, { name });
  return data;
}

export async function deleteGroup(id: number) {
  const { data } = await api.delete(`/groups/${id}`);
  return data;
}
