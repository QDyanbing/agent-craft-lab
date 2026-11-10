import i18n from '@/i18n';

export { DEFAULT_PAGE_SIZE } from './pageSize';

export const showTotal = (total: number) =>
  i18n.t('pagination.total', { ns: 'common', count: total });
