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

interface ExtendedSlotPollingOptionsWithCallback extends ExtendedSlotPollingOptions {
  onUpdate?: (data: { bookedSlots?: string[]; activeSelections?: string[]; lockedSlots?: string[] }) => void;
}

export const useHeartbeatSlotPolling = ({ date, employeeId, enabled = true, clientId, selectedTime, excludeAppointmentId, onUpdate }: ExtendedSlotPollingOptionsWithCallback) => {
  const { isConnected, setConnectionStatus } = useHeartbeat({
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
      
      // Update global store via callback
      if (onUpdate) {
        onUpdate({
          bookedSlots: newBookedSlots,
          activeSelections: newActiveSelections,
          lockedSlots: newLockedSlots
        });
      }
      
      // Update connection status
      if (setConnectionStatus) {
        setConnectionStatus(true);
      }
    }
  });

  return { isConnected };
};
