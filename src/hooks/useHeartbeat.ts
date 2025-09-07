import { useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    wp: {
      heartbeat: {
        interval: (interval: string) => void;
        connectNow: () => void;
        enqueue: (handle: string, data: any) => void;
      };
    };
    jQuery: any;
  }
}

interface HeartbeatData {
  appointments?: any[];
  availability?: string[];
  conflicts?: string[];
  validation_errors?: Record<string, string>;
  booking_confirmed?: boolean;
  appointment_id?: string;
  error?: string;
}

export const useHeartbeat = (
  onData: (data: HeartbeatData) => void,
  userEmail?: string
) => {
  const lastDataRef = useRef<string>('');

  const sendHeartbeatData = useCallback((data: any) => {
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
    const handleHeartbeatSend = (e: any, data: any) => {
      // Don't automatically send user data requests via heartbeat
      // This prevents the loading spinner from showing every 15 seconds
    };

    // Receive booking data from heartbeat
    const handleHeartbeatTick = (e: any, data: any) => {
      if (data.appointease_booking) {
        const receivedData = JSON.stringify(data.appointease_booking);
        if (receivedData !== lastDataRef.current) {
          lastDataRef.current = receivedData;
          onData(data.appointease_booking);
        }
      }
    };

    $(document).on('heartbeat-send', handleHeartbeatSend);
    $(document).on('heartbeat-tick', handleHeartbeatTick);

    return () => {
      $(document).off('heartbeat-send', handleHeartbeatSend);
      $(document).off('heartbeat-tick', handleHeartbeatTick);
    };
  }, [userEmail, onData]);

  return { sendHeartbeatData };
};