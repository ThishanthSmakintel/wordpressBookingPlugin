/**
 * Custom 1-second Slot Polling Hook
 * Replaces WordPress Heartbeat with direct REST API polling
 */

import { useState, useEffect, useRef } from 'react';

interface SlotPollingOptions {
  date: string;
  employeeId: number;
  enabled?: boolean;
  clientId?: string;
  selectedTime?: string;
  excludeAppointmentId?: string;
}

export const useSlotPolling = ({ 
  date, 
  employeeId, 
  enabled = true, 
  clientId, 
  selectedTime, 
  excludeAppointmentId 
}: SlotPollingOptions) => {
  const [activeSelections, setActiveSelections] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [pollCount, setPollCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !date || !employeeId) {
      setIsConnected(false);
      return;
    }

    const apiRoot = (window as any).bookingAPI?.root || '/wp-json/';
    
    const poll = async () => {
      try {
        const params = new URLSearchParams({
          date,
          employee_id: String(employeeId),
          ...(clientId && { client_id: clientId }),
          ...(selectedTime && { selected_time: selectedTime }),
          ...(excludeAppointmentId && { exclude_appointment_id: excludeAppointmentId })
        });

        const response = await fetch(`${apiRoot}appointease/v1/slots/poll?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        
        setActiveSelections(data.active_selections || []);
        setBookedSlots(data.booked_slots || []);
        setLockedSlots(data.locked_slots || []);
        setLastUpdate(Date.now());
        setPollCount(prev => prev + 1);
        setIsConnected(true);
      } catch (error) {
        console.error('[SlotPolling] Poll failed:', error);
        setIsConnected(false);
      }
    };

    // Initial poll
    poll();

    // Poll every 1 second
    intervalRef.current = setInterval(poll, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [date, employeeId, enabled, clientId, selectedTime, excludeAppointmentId]);

  return {
    activeSelections,
    bookedSlots,
    lockedSlots,
    isConnected,
    lastUpdate,
    pollCount
  };
};
