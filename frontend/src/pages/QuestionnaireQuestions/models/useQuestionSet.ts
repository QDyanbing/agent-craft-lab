import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  moduleUuid?: string;
  question?: API.IQuestionnaireQuestion | null;
  onCreate: (moduleUuid: string) => void;
  onModify: (moduleUuid: string, question: API.IQuestionnaireQuestion) => void;
  onCancel: () => void;
}

export default create<Store>((set) => {
  const moduleUuid = undefined;
  const question = undefined;

  const onCreate = (moduleUuid: string) => set({ moduleUuid, question: null });

  const onModify = (moduleUuid: string, question: API.IQuestionnaireQuestion) =>
    set({ moduleUuid, question });

  const onCancel = () => set({ moduleUuid, question });

  usePage.subscribe(() => set({ moduleUuid, question }));

  return { moduleUuid, question, onCreate, onModify, onCancel };
});
