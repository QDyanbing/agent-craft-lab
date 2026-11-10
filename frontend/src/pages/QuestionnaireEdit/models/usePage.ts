import { create } from 'zustand';

interface Store {
  uuid?: string;
  mount: (uuid?: string) => void;
  unmount: () => void;
}

export default create<Store>((set) => {
  const uuid = undefined;

  const mount = (uuid?: string) => set({ uuid });
  const unmount = () => set({ uuid: undefined });

  return { uuid, mount, unmount };
});
