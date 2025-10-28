import { useEffect, useRef, useCallback } from 'react';
import { RealtimeService, createRealtimeService } from '../services/realtimeService';

let globalRealtimeService: RealtimeService | null = null;

export const useRealtimeService = () => {
    const serviceRef = useRef<RealtimeService | null>(null);

    useEffect(() => {
        if (!globalRealtimeService) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.hostname}:8080`;
            const pollingUrl = `${window.bookingAPI?.root || '/wp-json/'}appointease/v1/realtime/poll`;
            //console.log('[useRealtimeService] Connecting to:', wsUrl);
            
            globalRealtimeService = createRealtimeService({
                wsUrl,
                pollingUrl,
                pollingInterval: 5000
            });
            
            globalRealtimeService.connect().catch(err => {
                console.error('[useRealtimeService] Connection failed:', err);
            });
        }
        
        serviceRef.current = globalRealtimeService;
        
        return () => {
            // Don't disconnect on unmount, keep connection alive
        };
    }, []);

    const send = useCallback((type: string, data: any) => {
        serviceRef.current?.send(type, data);
    }, []);

    const on = useCallback((event: string, handler: (data: any) => void) => {
        return serviceRef.current?.on(event, handler) || (() => {});
    }, []);

    const off = useCallback((event: string, handler: (data: any) => void) => {
        // RealtimeService returns unsubscribe function from on()
    }, []);

    return { send, on, off };
};
