import { getDetail } from '@/services/questionnaire';
import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  loading: boolean;
  data?: API.QuestionnaireDetail;
  onRefresh: () => Promise<void>;
}

export default create<Store>((set) => {
  const loading = false;
  const data = undefined;

  const getData = async () => {
    const { uuid } = usePage.getState();
    if (!uuid) return;

    try {
      set({ loading: true });
      const result = await getDetail(uuid);
      if (usePage.getState().uuid === uuid) set({ data: result?.data });
    } finally {
      if (usePage.getState().uuid === uuid) set({ loading: false });
    }
  };

  usePage.subscribe(() => {
    set({ loading, data });
    getData();
  });

  return { loading, data, onRefresh: getData };
});
