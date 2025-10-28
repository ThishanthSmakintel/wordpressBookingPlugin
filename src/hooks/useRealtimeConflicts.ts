/**
 * Real-time Conflict Detection Hook
 * Integrates with WebSocket broadcaster for instant booking conflict notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface ConflictData {
  type: string;
  slot: string;
  date: string;
  time: string;
  employee_id: number;
  timestamp: number;
}

interface RealtimeState {
  isConnected: boolean;
  connectionMode: 'websocket' | 'polling' | 'disconnected';
  conflicts: ConflictData[];
  lastUpdate: number;
}

export const useRealtimeConflicts = (watchedSlots: Array<{date: string, time: string, employeeId: number}> = []) => {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    connectionMode: 'disconnected',
    conflicts: [],
    lastUpdate: 0
  });
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(`client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  /**
   * Initialize WebSocket connection
   */
  const initWebSocket = useCallback(() => {
    try {
      const wsUrl = `ws://localhost:8080/appointease`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        //console.log('[RealtimeConflicts] WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionMode: 'websocket'
        }));
        
        // Register watched slots
        watchedSlots.forEach(slot => {
          ws.send(JSON.stringify({
            type: 'watch_slot',
            date: slot.date,
            time: slot.time,
            employee_id: slot.employeeId,
            client_id: clientIdRef.current
          }));
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('[RealtimeConflicts] WebSocket message parse error:', error);
        }
      };
      
      ws.onclose = () => {
        //console.log('[RealtimeConflicts] WebSocket disconnected, falling back to polling');
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionMode: 'polling'
        }));
        initPolling();
      };
      
      ws.onerror = (error) => {
        console.error('[RealtimeConflicts] WebSocket error:', error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionMode: 'polling'
        }));
        initPolling();
      };
      
      websocketRef.current = ws;
      
    } catch (error) {
      console.error('[RealtimeConflicts] WebSocket initialization failed:', error);
      initPolling();
    }
  }, [watchedSlots]);
  
  /**
   * Initialize polling fallback
   */
  const initPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setState(prev => ({
      ...prev,
      connectionMode: 'polling'
    }));
    
    const poll = async () => {
      try {
        const response = await fetch(`${window.bookingAPI?.root}appointease/v1/realtime/poll?last_update=${state.lastUpdate}&client_id=${clientIdRef.current}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.type === 'update' && data.data?.length > 0) {
            data.data.forEach((update: any) => handleRealtimeUpdate(update));
          }
          
          setState(prev => ({
            ...prev,
            isConnected: true,
            lastUpdate: data.timestamp
          }));
        }
      } catch (error) {
        console.error('[RealtimeConflicts] Polling error:', error);
        setState(prev => ({
          ...prev,
          isConnected: false
        }));
      }
    };
    
    // Poll every 5 seconds for conflicts
    pollingIntervalRef.current = setInterval(poll, 5000);
    
    // Initial poll
    poll();
  }, [state.lastUpdate]);
  
  /**
   * Handle real-time updates from WebSocket or polling
   */
  const handleRealtimeUpdate = useCallback((update: any) => {
    if (update.type === 'slot_conflict' || update.type === 'slot_taken') {
      const conflictData: ConflictData = {
        type: update.type,
        slot: update.data.slot || `${update.data.date}_${update.data.time}_${update.data.employee_id}`,
        date: update.data.date,
        time: update.data.time,
        employee_id: update.data.employee_id,
        timestamp: update.timestamp
      };
      
      setState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, conflictData].slice(-10), // Keep last 10 conflicts
        lastUpdate: Math.max(prev.lastUpdate, update.timestamp)
      }));
      
      // Check if this conflicts with watched slots
      const isWatchedSlot = watchedSlots.some(slot => 
        slot.date === conflictData.date && 
        slot.time === conflictData.time && 
        slot.employeeId === conflictData.employee_id
      );
      
      if (isWatchedSlot) {
        // Trigger conflict notification
        onSlotConflict(conflictData);
      }
    }
  }, [watchedSlots]);
  
  /**
   * Handle slot conflict notification
   */
  const onSlotConflict = useCallback((conflictData: ConflictData) => {
    console.warn('[RealtimeConflicts] Slot conflict detected:', conflictData);
    
    // Show user notification
    if (window.Toastify) {
      window.Toastify({
        text: `⚠️ Time slot ${conflictData.time} on ${conflictData.date} was just booked by another user`,
        duration: 8000,
        backgroundColor: '#e74c3c',
        className: 'realtime-conflict-toast',
        close: true
      }).showToast();
    }
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('appointease:slot_conflict', {
      detail: conflictData
    }));
  }, []);
  
  /**
   * Watch a specific time slot for conflicts
   */
  const watchSlot = useCallback((date: string, time: string, employeeId: number) => {
    const message = {
      type: 'watch_slot',
      date,
      time,
      employee_id: employeeId,
      client_id: clientIdRef.current
    };
    
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      // Register with polling system
      fetch(`${window.bookingAPI?.root}appointease/v1/realtime/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      }).catch(error => {
        console.error('[RealtimeConflicts] Failed to register slot watcher:', error);
      });
    }
  }, []);
  
  /**
   * Stop watching a specific slot
   */
  const unwatchSlot = useCallback((date: string, time: string, employeeId: number) => {
    const message = {
      type: 'unwatch_slot',
      date,
      time,
      employee_id: employeeId,
      client_id: clientIdRef.current
    };
    
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  /**
   * Clear all conflicts
   */
  const clearConflicts = useCallback(() => {
    setState(prev => ({
      ...prev,
      conflicts: []
    }));
  }, []);
  
  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    // Try WebSocket first, fallback to polling
    initWebSocket();
    
    return () => {
      // Cleanup on unmount
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  
  /**
   * Update watched slots when they change
   */
  useEffect(() => {
    if (state.isConnected && watchedSlots.length > 0) {
      watchedSlots.forEach(slot => {
        watchSlot(slot.date, slot.time, slot.employeeId);
      });
    }
  }, [watchedSlots, state.isConnected, watchSlot]);
  
  return {
    ...state,
    watchSlot,
    unwatchSlot,
    clearConflicts,
    clientId: clientIdRef.current
  };
};