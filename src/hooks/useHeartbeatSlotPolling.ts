/**
 * Heartbeat-based Slot Polling Hook
 * Polls for active slot selections every 5 seconds via WordPress Heartbeat
 */

import { useState, useEffect } from 'react';
import { useHeartbeat } from './useHeartbeat';

interface SlotPollingOptions {
  date: string;
  employeeId: number;
  enabled?: boolean;
}

interface ExtendedSlotPollingOptions extends SlotPollingOptions {
  clientId?: string;
  selectedTime?: string;
}

export const useHeartbeatSlotPolling = ({ date, employeeId, enabled = true, clientId, selectedTime }: ExtendedSlotPollingOptions) => {
  const [activeSelections, setActiveSelections] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const { isConnected } = useHeartbeat({
    enabled: enabled && !!date && !!employeeId,
    pollData: date && employeeId ? { 
      date, 
      employee_id: parseInt(String(employeeId)),
      client_id: clientId,
      selected_time: selectedTime
    } : null,
    onPoll: (data: any) => {
      console.log('[HeartbeatPolling] ===== POLL RECEIVED =====');
      console.log('[HeartbeatPolling] Full data:', data);
      console.log('[HeartbeatPolling] Active selections:', data?.appointease_active_selections);
      console.log('[HeartbeatPolling] Booked slots:', data?.appointease_booked_slots);
      console.log('[HeartbeatPolling] Locked slots:', data?.appointease_locked_slots);
      
      const active = data?.appointease_active_selections || [];
      const booked = data?.appointease_booked_slots || [];
      const locked = data?.appointease_locked_slots || [];
      
      console.log('[HeartbeatPolling] Setting state:');
      console.log('  - Active:', active);
      console.log('  - Booked:', booked);
      console.log('  - Locked:', locked);
      
      setActiveSelections(active);
      setBookedSlots(booked);
      setLockedSlots(locked);
      setLastUpdate(Date.now());
    }
  });

  console.log('[HeartbeatPolling] Current state:', {
    activeSelections,
    bookedSlots,
    lockedSlots,
    lastUpdate
  });

  return {
    activeSelections,
    bookedSlots,
    lockedSlots,
    isConnected,
    lastUpdate
  };
};
