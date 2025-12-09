import { create } from 'zustand';
import { Toilet } from '@/types/toilet';

interface MapState {
  filters: Record<string, any>;
  setFilters: (f: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selected: Toilet | null;
  setSelected: (t: Toilet | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  filters: {},
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selected: null,
  setSelected: (t) => set({ selected: t }),
}));
