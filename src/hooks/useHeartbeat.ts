import { useEffect, useCallback, useRef } from 'react';

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointment_date: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

interface JQueryEvent {
  type: string;
  target: Element;
}

interface HeartbeatEventData {
  [key: string]: unknown;
}

declare global {
  interface Window {
    wp: {
      heartbeat: {
        interval: (interval: string) => void;
        connectNow: () => void;
        enqueue: (handle: string, data: HeartbeatEventData) => void;
      };
    };
    jQuery: {
      (selector: string | Document): {
        on: (event: string, handler: (e: JQueryEvent, data: HeartbeatEventData) => void) => void;
        off: (event: string, handler?: (e: JQueryEvent, data: HeartbeatEventData) => void) => void;
      };
    };
  }
}

interface HeartbeatData {
  appointments?: Appointment[];
  availability?: string[];
  conflicts?: string[];
  validation_errors?: Record<string, string>;
  booking_confirmed?: boolean;
  appointment_id?: string;
  error?: string;
}

export const useHeartbeat = (
  onData: (data: HeartbeatData) => void
) => {
  const lastDataRef = useRef<HeartbeatData | null>(null);

  const sendHeartbeatData = useCallback((data: HeartbeatEventData) => {
    if (window.wp?.heartbeat) {
      window.wp.heartbeat.enqueue('appointease_booking', data);
    }
  }, []);

  useEffect(() => {
    if (!window.jQuery || !window.wp?.heartbeat) return;

    const $ = window.jQuery;

    // Set heartbeat interval to 15 seconds for booking management
    window.wp.heartbeat.interval('15');

    // Send booking data on heartbeat - only when explicitly requested
    const handleHeartbeatSend = (e: JQueryEvent, data: HeartbeatEventData) => {
      // Don't automatically send user data requests via heartbeat
      // This prevents the loading spinner from showing every 15 seconds
    };

    // Receive booking data from heartbeat
    const handleHeartbeatTick = (e: JQueryEvent, data: HeartbeatEventData) => {
      if (data.appointease_booking) {
        const receivedData = data.appointease_booking as HeartbeatData;
        if (!lastDataRef.current || hasDataChanged(lastDataRef.current, receivedData)) {
          lastDataRef.current = receivedData;
          onData(receivedData);
        }
      }
    };

    $(document).on('heartbeat-send', handleHeartbeatSend);
    $(document).on('heartbeat-tick', handleHeartbeatTick);

    return () => {
      $(document).off('heartbeat-send', handleHeartbeatSend);
      $(document).off('heartbeat-tick', handleHeartbeatTick);
    };
  }, [onData]);

  // Efficient data comparison without JSON.stringify
  const hasDataChanged = (prev: HeartbeatData, current: HeartbeatData): boolean => {
    return (
      prev.booking_confirmed !== current.booking_confirmed ||
      prev.appointment_id !== current.appointment_id ||
      prev.error !== current.error ||
      prev.appointments?.length !== current.appointments?.length ||
      prev.availability?.length !== current.availability?.length ||
      prev.conflicts?.length !== current.conflicts?.length
    );
  };

  return { sendHeartbeatData };
};