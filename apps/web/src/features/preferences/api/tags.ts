import api from '@/lib/api';
import type { TagsResponse } from '@/types/api';

export async function getTags(): Promise<TagsResponse> {
  const { data } = await api.get<TagsResponse>('/tags');
  return data;
}

export async function createTag(input: { name: string }) {
  const { data } = await api.post('/tags', input);
  return data;
}

export async function deleteTag(id: number) {
  const { data } = await api.delete(`/tags/${id}`);
  return data;
}
