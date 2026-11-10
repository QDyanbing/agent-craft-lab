import { create } from 'zustand';
import usePage from './usePage';

interface Store {
  dialog?: { survey?: API.QuestionnaireSummary };
  onOpen: (survey?: API.QuestionnaireSummary) => void;
  onClose: () => void;
}

export default create<Store>((set) => {
  const dialog = undefined;
  const onOpen = (survey?: API.QuestionnaireSummary) => set({ dialog: { survey } });
  const onClose = () => set({ dialog });

  usePage.subscribe(({ ready }) => {
    if (!ready) onClose();
  });

  return { dialog, onOpen, onClose };
});
