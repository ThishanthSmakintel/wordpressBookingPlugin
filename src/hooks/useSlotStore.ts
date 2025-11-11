import { create } from 'zustand';
import { arraysEqual } from '../utils/smartDiff';

interface SlotState {
  // Slot data
  bookedSlots: string[];
  activeSelections: string[];
  lockedSlots: string[];
  
  // Selection state
  selectedSlot: string;
  isSelecting: boolean;
  
  // Metadata
  lastUpdate: number;
  isConnected: boolean;
  
  // Actions with smart diffing
  setBookedSlots: (slots: string[]) => void;
  setActiveSelections: (selections: string[]) => void;
  setLockedSlots: (locked: string[]) => void;
  setSelectedSlot: (slot: string) => void;
  setIsSelecting: (selecting: boolean) => void;
  setConnectionStatus: (connected: boolean) => void;
  updateSlotData: (data: {
    bookedSlots?: string[];
    activeSelections?: string[];
    lockedSlots?: string[];
  }) => void;
  clearSlots: () => void;
}

export const useSlotStore = create<SlotState>((set, get) => ({
  // Initial state
  bookedSlots: [],
  activeSelections: [],
  lockedSlots: [],
  selectedSlot: '',
  isSelecting: false,
  lastUpdate: 0,
  isConnected: false,

  // Smart diffing actions
  setBookedSlots: (slots) => {
    const current = get().bookedSlots;
    if (!arraysEqual(current, slots)) {
      set({ bookedSlots: slots, lastUpdate: Date.now() });
    }
  },

  setActiveSelections: (selections) => {
    const current = get().activeSelections;
    if (!arraysEqual(current, selections)) {
      set({ activeSelections: selections, lastUpdate: Date.now() });
    }
  },

  setLockedSlots: (locked) => {
    const current = get().lockedSlots;
    if (!arraysEqual(current, locked)) {
      set({ lockedSlots: locked, lastUpdate: Date.now() });
    }
  },

  setSelectedSlot: (slot) => {
    const current = get().selectedSlot;
    if (current !== slot) {
      set({ selectedSlot: slot, lastUpdate: Date.now() });
    }
  },

  setIsSelecting: (selecting) => {
    const current = get().isSelecting;
    if (current !== selecting) {
      set({ isSelecting: selecting });
    }
  },

  setConnectionStatus: (connected) => {
    const current = get().isConnected;
    if (current !== connected) {
      set({ isConnected: connected, lastUpdate: Date.now() });
    }
  },

  // Batch update with smart diffing
  updateSlotData: (data) => {
    const current = get();
    const updates: Partial<SlotState> = {};
    let hasChanges = false;

    if (data.bookedSlots && !arraysEqual(current.bookedSlots, data.bookedSlots)) {
      console.log('[SlotStore] Booked slots changed:', { old: current.bookedSlots, new: data.bookedSlots });
      updates.bookedSlots = data.bookedSlots;
      hasChanges = true;
    }

    if (data.activeSelections && !arraysEqual(current.activeSelections, data.activeSelections)) {
      console.log('[SlotStore] Active selections changed:', { old: current.activeSelections, new: data.activeSelections });
      updates.activeSelections = data.activeSelections;
      hasChanges = true;
    }

    if (data.lockedSlots && !arraysEqual(current.lockedSlots, data.lockedSlots)) {
      console.log('[SlotStore] Locked slots changed:', { old: current.lockedSlots, new: data.lockedSlots });
      updates.lockedSlots = data.lockedSlots;
      hasChanges = true;
    }

    if (hasChanges) {
      updates.lastUpdate = Date.now();
      set(updates);
      console.log('[SlotStore] State updated - re-render triggered');
    } else {
      console.log('[SlotStore] No changes detected - re-render prevented');
    }
  },

  clearSlots: () => {
    set({
      bookedSlots: [],
      activeSelections: [],
      lockedSlots: [],
      selectedSlot: '',
      isSelecting: false,
      lastUpdate: Date.now()
    });
  }
}));