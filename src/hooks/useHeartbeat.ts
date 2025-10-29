/**
 * WordPress Heartbeat API Hook
 * Redis-Primary System: Redis for fast temp data, Heartbeat+MySQL fallback
 * Handles all real-time operations through WordPress Heartbeat (5-second polling)
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { getRedisDataService } from '../services/redisDataService';

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
  const [latency, setLatency] = useState(0);
  const [redisOps, setRedisOps] = useState({ locks: 0, selections: 0 });
  const [redisStats, setRedisStats] = useState(null);
  const handlersRef = useRef<Map<string, (data: any) => void>>(new Map());
  const isInitializedRef = useRef(false);
  const lastConnectRef = useRef(0);
  const sendTimeRef = useRef(0);
  const lastDataRef = useRef<string>('');

  // Initialize heartbeat
  useEffect(() => {
    if (!enabled || typeof window.wp === 'undefined' || !window.wp.heartbeat) {
      return;
    }

    // Allow re-initialization when pollData changes
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      setIsConnected(true);
      // Set heartbeat interval to 1 second for ultra-fast real-time updates
      window.wp.heartbeat.interval(1);
    }

    // Heartbeat send event - add data to be sent
    const handleSend = (event: any, data: any) => {
      sendTimeRef.current = Date.now();
      console.log('[Heartbeat] ===== SEND EVENT =====');
      console.log('[Heartbeat] pollData:', pollData);
      
      // Add poll data if provided
      if (pollData) {
        data.appointease_poll = pollData;
        console.log('[Heartbeat] ✓ Added poll data:', pollData);
      } else {
        console.log('[Heartbeat] ✗ No poll data to send');
      }
      console.log('[Heartbeat] Full data being sent:', data);

      // Add any queued actions
      handlersRef.current.forEach((handler, key) => {
        if (key.startsWith('send_')) {
          const actionKey = key.replace('send_', '');
          data[actionKey] = handler(data);
          console.log('[Heartbeat] Added action:', actionKey, data[actionKey]);
        }
      });
    };

    // Heartbeat tick event - process received data
    const handleTick = (event: any, data: any) => {
      const timestamp = new Date().toISOString();
      const logEntry = `\n[${timestamp}] TICK EVENT\nData: ${JSON.stringify(data, null, 2)}\n`;
      
      // Save to localStorage
      try {
        const logs = localStorage.getItem('heartbeat_logs') || '';
        localStorage.setItem('heartbeat_logs', logs + logEntry);
      } catch (e) {}
      
      console.log('[Heartbeat] ===== TICK EVENT FIRED =====');
      console.log('[Heartbeat] Data:', data);
      const tickLatency = Date.now() - sendTimeRef.current;
      setLatency(tickLatency);
      
      // Update storage mode only if changed
      if (data.redis_status === 'available' && storageMode !== 'redis') {
        setStorageMode('redis');
      } else if (data.redis_status === 'unavailable' && storageMode !== 'mysql') {
        setStorageMode('mysql');
      }
      
      // Update Redis operations count
      if (data.redis_ops) {
        setRedisOps(data.redis_ops);
      }
      
      // Update Redis stats
      if (data.redis_stats) {
        setRedisStats(data.redis_stats);
      }
      
      // Handle poll response
      console.log('[Heartbeat] ===== TICK RECEIVED =====');
      console.log('[Heartbeat] onPoll exists?', !!onPoll);
      console.log('[Heartbeat] Data received:', data);
      if (onPoll) {
        console.log('[Heartbeat] Calling onPoll with data');
        onPoll(data);
      } else {
        console.log('[Heartbeat] ✗ No onPoll callback registered');
      }

      // Handle other responses
      handlersRef.current.forEach((handler, key) => {
        if (key.startsWith('receive_') && data[key.replace('receive_', '')]) {
          console.log('[Heartbeat] Handling response for:', key);
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
  }, [enabled, pollData, onPoll, storageMode]);

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

  // Select time slot - Uses Redis-primary service
  const selectSlot = useCallback(async (date: string, time: string, employeeId: number, clientId: string) => {
    const redisService = getRedisDataService();
    if (redisService) {
      return redisService.selectSlot(date, time, employeeId, clientId);
    }
    
    // Fallback to direct Heartbeat
    return new Promise((resolve, reject) => {
      send('appointease_booking', {
        action: 'select_slot',
        date,
        time,
        employee_id: employeeId,
        client_id: clientId
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [send]);

  // Deselect time slot - Uses Redis-primary service
  const deselectSlot = useCallback(async (date: string, time: string, employeeId: number) => {
    const redisService = getRedisDataService();
    if (redisService) {
      return redisService.deselectSlot(date, time, employeeId);
    }
    
    // Fallback to direct Heartbeat
    return new Promise((resolve, reject) => {
      send('appointease_booking', {
        action: 'deselect_slot',
        date,
        time,
        employee_id: employeeId
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, [send]);

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
    latency,
    redisOps,
    redisStats,
    send,
    selectSlot,
    deselectSlot,
    confirmBooking,
    getUserAppointments,
    cancelAppointment,
    rescheduleAppointment
  };
};
