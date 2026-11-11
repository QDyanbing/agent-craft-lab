import { getDetail } from '@/services/questionnaire/questionnaire';
import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  loading: boolean;
  data?: API.IQuestionnaireDetail;
  onRefresh: () => Promise<void>;
  onAnswer: (moduleUuid: string, questionUuid: string, answer: number | number[] | string) => void;
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

  const onAnswer = (moduleUuid: string, questionUuid: string, answer: number | number[] | string) => {
    const { uuid } = usePage.getState();
    set((state) => {
      const data = state.data;
      if (!data || data.uuid !== uuid) return state;
      return {
        data: {
          ...data,
          modules: data.modules.map((module) =>
            module.uuid === moduleUuid
              ? {
                  ...module,
                  questions: module.questions.map((question) =>
                    question.uuid === questionUuid ? { ...question, answer } : question,
                  ),
                }
              : module,
          ),
        },
      };
    });
  };

  usePage.subscribe(() => {
    set({ loading, data });
    getData();
  });

  return { loading, data, onRefresh: getData, onAnswer };
});
