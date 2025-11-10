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
  excludeAppointmentId?: string;
}

// Smart array comparison - only update if actually changed
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

export const useHeartbeatSlotPolling = ({ date, employeeId, enabled = true, clientId, selectedTime, excludeAppointmentId }: ExtendedSlotPollingOptions) => {
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
      ...(selectedTime ? { selected_time: selectedTime } : {}),
      ...(excludeAppointmentId ? { exclude_appointment_id: excludeAppointmentId } : {})
    } : null,
    onPoll: (data: any) => {
      const newActiveSelections = data?.appointease_active_selections || [];
      const newBookedSlots = data?.appointease_booked_slots || [];
      const newLockedSlots = data?.appointease_locked_slots || [];
      
      // Smart diffing - only update if changed
      setActiveSelections(prev => arraysEqual(prev, newActiveSelections) ? prev : newActiveSelections);
      setBookedSlots(prev => arraysEqual(prev, newBookedSlots) ? prev : newBookedSlots);
      setLockedSlots(prev => arraysEqual(prev, newLockedSlots) ? prev : newLockedSlots);
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
