/**
 * Custom 1-second polling for real-time slot updates
 * Bypasses WordPress Heartbeat 5s limitation
 */

import { useEffect, useRef } from 'react';
import { useSlotStore } from './useSlotStore';

interface PollingOptions {
  date: string;
  employeeId: number;
  enabled?: boolean;
  clientId?: string;
  excludeAppointmentId?: string;
}

export const useRealtimePolling = ({
  date,
  employeeId,
  enabled = true,
  clientId,
  excludeAppointmentId
}: PollingOptions) => {
  const { updateSlotData, setConnectionStatus } = useSlotStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !date || !employeeId) {
      setConnectionStatus(false);
      return;
    }

    const poll = async () => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const endpoint = excludeAppointmentId
          ? `${(window as any).bookingAPI?.root || '/wp-json/'}appointease/v1/reschedule-availability`
          : `${(window as any).bookingAPI?.root || '/wp-json/'}booking/v1/availability`;

        const body: any = {
          date,
          employee_id: employeeId
        };

        if (excludeAppointmentId) {
          body.exclude_appointment_id = excludeAppointmentId;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          
          updateSlotData({
            bookedSlots: data.unavailable === 'all' ? [] : (data.unavailable || []),
            activeSelections: [], // Server returns combined in unavailable
            lockedSlots: []
          });

          setConnectionStatus(true);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('[RealtimePolling] Error:', error);
          setConnectionStatus(false);
        }
      }
    };

    // Initial poll
    poll();

    // Poll every 1 second
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [date, employeeId, enabled, excludeAppointmentId, updateSlotData, setConnectionStatus]);

  return useSlotStore();
};
