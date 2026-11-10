import { getSearch } from '@/services/questionnaire';
import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  loading: boolean;
  data: API.QuestionnaireSummary[];
  total: number;
  hasError: boolean;
  onRefresh: () => Promise<void>;
}

export default create<Store>((set) => {
  const loading = false;
  const data: API.QuestionnaireSummary[] = [];
  const total = 0;
  const hasError = false;

  const getData = async () => {
    const { ready, params, onPaginationChange } = usePage.getState();
    if (!ready) return;
    set({ loading: true, hasError: false });
    const result = await getSearch(params).finally(() => {
      if (usePage.getState().ready) set({ loading: false });
    });
    if (!usePage.getState().ready) return;
    if (!result) {
      set({ hasError: true });
      return;
    }
    const { list, total } = result.data;
    const lastPage = Math.max(1, Math.ceil(total / params.pageSize));
    if (params.pageNum > lastPage) {
      onPaginationChange(lastPage, params.pageSize);
      return;
    }
    set({ data: list, total });
  };

  usePage.subscribe(({ ready }) => {
    if (ready) getData();
    else set({ loading, data, total, hasError });
  });

  return { loading, data, total, hasError, onRefresh: getData };
});
