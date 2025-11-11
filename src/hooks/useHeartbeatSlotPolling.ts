/**
 * Heartbeat-based Slot Polling Hook
 * Polls for active slot selections via WordPress Heartbeat
 * Uses Zustand store for centralized state management with smart diffing
 */

import { useEffect } from 'react';
import { useHeartbeat } from './useHeartbeat';
import { useSlotStore } from './useSlotStore';

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
  const { updateSlotData, setConnectionStatus } = useSlotStore();

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
      // Zustand store handles smart diffing internally
      updateSlotData({
        activeSelections: data?.appointease_active_selections || [],
        bookedSlots: data?.appointease_booked_slots || [],
        lockedSlots: data?.appointease_locked_slots || []
      });
    }
  });

  // Sync connection status to store
  useEffect(() => {
    setConnectionStatus(isConnected);
  }, [isConnected, setConnectionStatus]);

  // Return store selectors for backward compatibility
  return useSlotStore();
};
