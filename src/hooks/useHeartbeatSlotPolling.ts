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
      console.log('[HeartbeatPolling] Raw data received:', data);
      console.log('[HeartbeatPolling] Active selections:', data?.appointease_active_selections);
      console.log('[HeartbeatPolling] Booked slots:', data?.appointease_booked_slots);
      console.log('[HeartbeatPolling] Redis status:', data?.redis_status);
      
      const newActiveSelections = data?.appointease_active_selections || [];
      const newBookedSlots = data?.appointease_booked_slots || [];
      const newLockedSlots = data?.appointease_locked_slots || [];
      
      console.log('[HeartbeatPolling] Setting state:', { 
        activeSelections: newActiveSelections, 
        bookedSlots: newBookedSlots, 
        lockedSlots: newLockedSlots 
      });
      
      setActiveSelections(newActiveSelections);
      setBookedSlots(newBookedSlots);
      setLockedSlots(newLockedSlots);
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
