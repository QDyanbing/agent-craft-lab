import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  module?: API.IQuestionnaireModule | null;
  onCreate: () => void;
  onModify: (module: API.IQuestionnaireModule) => void;
  onCancel: () => void;
}

export default create<Store>((set) => {
  const module = undefined;

  const onCreate = () => set({ module: null });

  const onModify = (module: API.IQuestionnaireModule) => set({ module });

  const onCancel = () => set({ module });

  usePage.subscribe(() => set({ module }));

  return { module, onCreate, onModify, onCancel };
});
