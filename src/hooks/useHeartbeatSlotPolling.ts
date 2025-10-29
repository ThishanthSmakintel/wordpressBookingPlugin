/**
 * Heartbeat-based Slot Polling Hook
 * Polls for active slot selections every second via WordPress Heartbeat
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
  const [pollCount, setPollCount] = useState(0);

  const { isConnected } = useHeartbeat({
    enabled: enabled && !!date && !!employeeId,
    pollData: date && employeeId ? { 
      date, 
      employee_id: parseInt(String(employeeId)),
      ...(clientId ? { client_id: clientId } : {}),
      ...(selectedTime ? { selected_time: selectedTime } : {})
    } : null,
    onPoll: (data: any) => {
      console.log('[HeartbeatPolling] Current state:', { activeSelections, bookedSlots, lockedSlots, lastUpdate });
      setActiveSelections(data?.appointease_active_selections || []);
      setBookedSlots(data?.appointease_booked_slots || []);
      setLockedSlots(data?.appointease_locked_slots || []);
      setLastUpdate(Date.now());
      setPollCount(prev => prev + 1);
    }
  });

  return {
    activeSelections,
    bookedSlots,
    lockedSlots,
    isConnected,
    lastUpdate,
    pollCount
  };
};
