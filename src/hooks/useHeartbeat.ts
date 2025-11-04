/**
 * WordPress Heartbeat API Hook
 * Handles all real-time operations through WordPress Heartbeat (5-second polling)
 */

import { useEffect, useCallback, useRef, useState } from 'react';

declare global {
  interface Window {
    wp: {
      heartbeat: {
        interval: (seconds: number) => void;
        enqueue: (handle: string, data: any, textStatus?: string, jqXHR?: any) => void;
        connectNow: () => void;
      };
    };
    jQuery: any;
  }
}

interface HeartbeatOptions {
  enabled?: boolean;
  onPoll?: (data: any) => void;
  pollData?: any;
}

export const useHeartbeat = (options: HeartbeatOptions = {}) => {
  const { enabled = true, onPoll, pollData } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [storageMode, setStorageMode] = useState<'redis' | 'mysql'>('redis');
  const [redisOps, setRedisOps] = useState({ locks: 0, selections: 0, user_selection: 0 });
  const handlersRef = useRef<Map<string, (data: any) => void>>(new Map());
  const isInitializedRef = useRef(false);
  const lastConnectRef = useRef(0);

  // Initialize heartbeat
  useEffect(() => {
    if (!enabled || typeof window.wp === 'undefined' || !window.wp.heartbeat || isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;
    setIsConnected(true);

    // Set heartbeat interval to 5 seconds (WordPress minimum)
    window.wp.heartbeat.interval(5);
    console.log('[Heartbeat] Interval set to 5 seconds');

    // Heartbeat send event - add data to be sent
    const handleSend = (event: any, data: any) => {
      console.log('[Heartbeat] Send event triggered');
      
      // Add poll data if provided
      if (pollData) {
        data.appointease_poll = pollData;
        console.log('[Heartbeat] Added poll data:', pollData);
      }

      // Add any queued actions
      handlersRef.current.forEach((handler, key) => {
        if (key.startsWith('send_')) {
          const actionKey = key.replace('send_', '');
          data[actionKey] = handler(data);
        }
      });
    };

    // Heartbeat tick event - process received data
    const handleTick = (event: any, data: any) => {
      console.log('[Heartbeat] Tick event received:', data);
      
      if (data.redis_status === 'available') setStorageMode('redis');
      else if (data.redis_status === 'unavailable') setStorageMode('mysql');
      
      if (data.redis_ops) {
        setRedisOps({
          locks: data.redis_ops.locks || 0,
          selections: data.redis_ops.selections || 0,
          user_selection: data.redis_ops.user_selection || 0
        });
      }
      
      // Handle poll response
      if (onPoll) {
        onPoll(data);
      }

      // Handle other responses
      handlersRef.current.forEach((handler, key) => {
        if (key.startsWith('receive_') && data[key.replace('receive_', '')]) {
          handler(data[key.replace('receive_', '')]);
        }
      });
    };

    // Attach event listeners
    window.jQuery(document).on('heartbeat-send', handleSend);
    window.jQuery(document).on('heartbeat-tick', handleTick);

    // Cleanup
    return () => {
      window.jQuery(document).off('heartbeat-send', handleSend);
      window.jQuery(document).off('heartbeat-tick', handleTick);
      setIsConnected(false);
      isInitializedRef.current = false;
    };
  }, [enabled, pollData, onPoll]);

  // Send action via heartbeat
  const send = useCallback((action: string, data: any, callback?: (response: any) => void) => {
    if (!window.wp?.heartbeat) {
      console.error('[Heartbeat] WordPress Heartbeat API not available');
      return;
    }

    console.log('[Heartbeat] Sending action:', action, data);

    // Store callback for response
    if (callback) {
      handlersRef.current.set(`receive_${action}`, callback);
    }

    // Queue data to be sent on next heartbeat
    handlersRef.current.set(`send_${action}`, () => data);

    // Throttle connectNow to prevent request loops (max once per 2 seconds)
    const now = Date.now();
    if (now - lastConnectRef.current > 2000) {
      lastConnectRef.current = now;
      window.wp.heartbeat.connectNow();
      console.log('[Heartbeat] Triggered immediate connection');
    } else {
      console.log('[Heartbeat] Throttled - will send on next tick');
    }
  }, []);

  // Select time slot - Use direct REST API
  const selectSlot = useCallback(async (date: string, time: string, employeeId: number, clientId: string) => {
    try {
      const response = await fetch(`${(window as any).bookingAPI?.root || '/wp-json/'}appointease/v1/slots/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, employee_id: employeeId, client_id: clientId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      console.log('[Heartbeat] Slot selected via REST:', data);
      return data;
    } catch (error) {
      console.error('[Heartbeat] REST selection failed:', error);
      throw error;
    }
  }, []);

  // Deselect time slot
  const deselectSlot = useCallback(async (date: string, time: string, employeeId: number) => {
    try {
      const response = await fetch(`${(window as any).bookingAPI?.root || '/wp-json/'}appointease/v1/slots/deselect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, employee_id: employeeId })
      });
      const data = await response.json();
      console.log('[Heartbeat] Slot deselected via REST:', data);
      return data;
    } catch (error) {
      console.error('[Heartbeat] REST deselection failed:', error);
      return { success: false };
    }
  }, []);

  // Confirm booking
  const confirmBooking = useCallback((bookingData: any) => {
    return new Promise((resolve, reject) => {
      send('appointease_booking', {
        action: 'confirm_booking',
        ...bookingData
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [send]);

  // Get user appointments
  const getUserAppointments = useCallback((email: string) => {
    return new Promise((resolve, reject) => {
      send('appointease_booking', {
        action: 'get_user_data',
        user_email: email
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [send]);

  // Cancel appointment
  const cancelAppointment = useCallback((appointmentId: string, email: string) => {
    return new Promise((resolve, reject) => {
      send('appointease_booking', {
        action: 'cancel_appointment',
        appointment_id: appointmentId,
        user_email: email
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [send]);

  // Reschedule appointment
  const rescheduleAppointment = useCallback((appointmentId: string, email: string, newDate: string, newTime: string) => {
    return new Promise((resolve, reject) => {
      send('appointease_booking', {
        action: 'reschedule_appointment',
        appointment_id: appointmentId,
        user_email: email,
        new_date: newDate,
        new_time: newTime
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [send]);

  return {
    isConnected,
    storageMode,
    redisOps,
    send,
    selectSlot,
    deselectSlot,
    confirmBooking,
    getUserAppointments,
    cancelAppointment,
    rescheduleAppointment
  };
};
