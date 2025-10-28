/**
 * React hook for real-time updates with WebSocket/Polling hybrid
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createRealtimeService, RealtimeService } from '../services/realtimeService';

interface UseRealtimeOptions {
  wsUrl?: string;
  pollingUrl: string;
  pollingInterval?: number;
  enabled?: boolean;
  onUpdate?: (data: any) => void;
  onConnectionChange?: (mode: 'websocket' | 'polling' | 'disconnected') => void;
}

export const useRealtime = (options: UseRealtimeOptions) => {
  const serviceRef = useRef<RealtimeService | null>(null);
  const [connectionMode, setConnectionMode] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);

  // Initialize service (WordPress Heartbeat mode)
  useEffect(() => {
    if (!options.enabled) return;

    // Using WordPress Heartbeat API - no WebSocket/polling needed
    setConnectionMode('polling'); // Show as 'polling' to indicate Heartbeat is active
    setIsConnected(true);
    options.onConnectionChange?.('polling');

    // Cleanup
    return () => {
      setConnectionMode('disconnected');
      setIsConnected(false);
    };
  }, [options.enabled]);

  // Send message (WebSocket only)
  const send = useCallback((type: string, data: any) => {
    serviceRef.current?.send(type, data);
  }, []);

  // Subscribe to custom events
  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    return serviceRef.current?.on(event, handler) || (() => {});
  }, []);

  return {
    connectionMode,
    isConnected,
    send,
    subscribe
  };
};
