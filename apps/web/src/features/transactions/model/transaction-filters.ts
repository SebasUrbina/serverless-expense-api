export type TransactionFilters = {
  search: string;
  month: string;
  categoryId: number | '';
  tagId: number | '';
  shared: boolean;
  groupId: number | '';
};

export const emptyTransactionFilters: TransactionFilters = {
  search: '',
  month: '',
  categoryId: '',
  tagId: '',
  shared: false,
  groupId: '',
};

const filterParamNames = [
  'search',
  'month',
  'category_id',
  'tag_id',
  'shared',
  'group_id',
] as const;

function parseId(value: string | null): number | '' {
  if (!value) return '';
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : '';
}

export function parseTransactionFilters(
  params: Pick<URLSearchParams, 'get'>,
): TransactionFilters {
  const shared = params.get('shared') === '1';

  return {
    search: params.get('search')?.trim() ?? '',
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('month') ?? '')
      ? (params.get('month') ?? '')
      : '',
    categoryId: parseId(params.get('category_id')),
    tagId: parseId(params.get('tag_id')),
    shared,
    groupId: shared ? parseId(params.get('group_id')) : '',
  };
}

export function serializeTransactionFilters(
  filters: TransactionFilters,
  currentParams?: Pick<URLSearchParams, 'toString'>,
) {
  const params = new URLSearchParams(currentParams?.toString());
  filterParamNames.forEach((name) => params.delete(name));

  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.month) params.set('month', filters.month);
  if (filters.categoryId !== '') {
    params.set('category_id', String(filters.categoryId));
  }
  if (filters.tagId !== '') params.set('tag_id', String(filters.tagId));
  if (filters.shared) params.set('shared', '1');
  if (filters.shared && filters.groupId !== '') {
    params.set('group_id', String(filters.groupId));
  }

  return params;
}
