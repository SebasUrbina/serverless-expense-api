import api from '@/lib/api';
import type { CategoriesResponse, Category } from '@/types/api';

export type UpdateCategoryInput = {
  id: number;
  name?: string;
  type?: Category['type'];
  icon?: string;
};

export async function getCategories(): Promise<CategoriesResponse> {
  const { data } = await api.get<CategoriesResponse>('/categories');
  return data;
}

export async function createCategory(input: Omit<Category, 'id'>) {
  const { data } = await api.post('/categories', input);
  return data;
}

export async function updateCategory({ id, ...input }: UpdateCategoryInput) {
  const { data } = await api.put(`/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: number) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}
