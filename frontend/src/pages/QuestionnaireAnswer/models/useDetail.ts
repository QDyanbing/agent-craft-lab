import { getDetail } from '@/services/questionnaire';
import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  loading: boolean;
  data?: API.QuestionnaireDetail;
}

export default create<Store>((set) => {
  const loading = false;
  const data = undefined;

  const getData = async (uuid: string) => {
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
    if (uuid) getData(uuid);
  });

  return { loading, data };
});
