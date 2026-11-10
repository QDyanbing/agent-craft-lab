import { getDetail } from '@/services/questionnaire';
import { create, type StoreApi } from 'zustand';

interface Store {
  loading: boolean;
  data?: API.QuestionnaireDetail;
  onRefresh: () => Promise<void>;
}

export default (usePage: Pick<StoreApi<{ uuid?: string }>, 'getState' | 'subscribe'>) =>
  create<Store>((set) => {
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

    usePage.subscribe(({ uuid }) => {
      set({ loading, data });
      if (uuid) getData();
    });

    return { loading, data, onRefresh: getData };
  });
