import { create } from 'zustand';

interface SidebarState {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  setOpen: (open) => set({ isOpen: open }),
  isOpen: false,
  isCollapsed: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}));
