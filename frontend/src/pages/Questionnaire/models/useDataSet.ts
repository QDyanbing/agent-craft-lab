import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  questionnaire?: API.IQuestionnaire | null;
  onCreate: () => void;
  onModify: (questionnaire: API.IQuestionnaire) => void;
  onCancel: () => void;
}

export default create<Store>((set) => {
  const questionnaire = undefined;

  const onCreate = () => set({ questionnaire: null });

  const onModify = (questionnaire: API.IQuestionnaire) => set({ questionnaire });

  const onCancel = () => set({ questionnaire });

  usePage.subscribe(({ ready }) => {
    if (!ready) onCancel();
  });

  return { questionnaire, onCreate, onModify, onCancel };
});
