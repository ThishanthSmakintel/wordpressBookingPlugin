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

  // Initialize service
  useEffect(() => {
    if (!options.enabled) return;

    const service = createRealtimeService({
      wsUrl: options.wsUrl,
      pollingUrl: options.pollingUrl,
      pollingInterval: options.pollingInterval || 10000
    });

    serviceRef.current = service;

    // Subscribe to connection changes
    const unsubConnection = service.on('connection', (data) => {
      setConnectionMode(data.mode);
      setIsConnected(data.status === 'connected');
      options.onConnectionChange?.(data.mode);
    });

    // Subscribe to updates
    const unsubUpdate = service.on('update', (data) => {
      options.onUpdate?.(data);
    });

    // Connect
    service.connect();

    // Cleanup
    return () => {
      unsubConnection();
      unsubUpdate();
      service.disconnect();
      serviceRef.current = null;
    };
  }, [options.enabled, options.wsUrl, options.pollingUrl, options.pollingInterval]);

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
