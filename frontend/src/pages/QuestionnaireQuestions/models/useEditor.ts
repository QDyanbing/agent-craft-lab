import { create } from 'zustand';
import usePage from './usePage';

type Dialog =
  | { kind: 'module'; moduleUuid?: string }
  | { kind: 'question'; moduleUuid: string; questionUuid?: string };

interface Store {
  dialog?: Dialog;
  collapsedModuleUuids: string[];
  onOpen: (dialog: Dialog) => void;
  onClose: () => void;
  onModuleExpandChange: (uuid: string, expanded: boolean) => void;
}

export default create<Store>((set) => {
  const dialog = undefined;
  const collapsedModuleUuids: string[] = [];

  const onOpen = (dialog: Dialog) => set({ dialog });

  const onClose = () => set({ dialog: undefined });

  const onModuleExpandChange = (uuid: string, expanded: boolean) =>
    set((state) => {
      const collapsed = state.collapsedModuleUuids;
      const isExpanded = !collapsed.includes(uuid);
      if (expanded === isExpanded) return state;
      return {
        collapsedModuleUuids: expanded
          ? collapsed.filter((key) => key !== uuid)
          : [...collapsed, uuid],
      };
    });

  usePage.subscribe(() => set({ dialog, collapsedModuleUuids }));

  return { dialog, collapsedModuleUuids, onOpen, onClose, onModuleExpandChange };
});
