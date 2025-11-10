/**
 * Heartbeat-based Slot Polling Hook
 * Polls for active slot selections every second via WordPress Heartbeat
 */

import { useState, useEffect } from 'react';
import { useHeartbeat } from './useHeartbeat';
import { arraysEqual, smartSetState } from '../utils/smartDiff';

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
      setActiveSelections(prev => {
        const next = smartSetState(prev, newActiveSelections, arraysEqual);
        if (next !== prev) console.log('[Polling] Active selections changed:', prev, '→', next);
        return next;
      });
      setBookedSlots(prev => {
        const next = smartSetState(prev, newBookedSlots, arraysEqual);
        if (next !== prev) console.log('[Polling] Booked slots changed:', prev, '→', next);
        return next;
      });
      setLockedSlots(prev => {
        const next = smartSetState(prev, newLockedSlots, arraysEqual);
        if (next !== prev) console.log('[Polling] Locked slots changed:', prev, '→', next);
        return next;
      });
      
      // Always update metadata
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
