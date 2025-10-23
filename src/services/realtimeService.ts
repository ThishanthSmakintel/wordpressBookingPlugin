/**
 * Hybrid Real-time Communication Service
 * Supports WebSocket with automatic fallback to HTTP polling
 */

type MessageHandler = (data: any) => void;
type ConnectionMode = 'websocket' | 'polling' | 'disconnected';

interface RealtimeConfig {
  wsUrl?: string;
  pollingUrl: string;
  pollingInterval?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class RealtimeService {
  private ws: WebSocket | null = null;
  private mode: ConnectionMode = 'disconnected';
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private pollingInterval: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private config: RealtimeConfig;
  private isConnecting = false;
  private lastPingTime: number = 0;
  private latency: number = 0;
  private pingInterval: number | null = null;

  constructor(config: RealtimeConfig) {
    this.config = {
      pollingInterval: 10000,
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      ...config
    };
    this.maxReconnectAttempts = config.reconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 3000;
  }

  /**
   * Connect to real-time service (tries WebSocket first, falls back to polling)
   */
  async connect(): Promise<void> {
    if (this.isConnecting) {
      console.log('[RealtimeService] Already connecting, skipping...');
      return;
    }
    this.isConnecting = true;

    console.log('[RealtimeService] Starting connection...');
    console.log('[RealtimeService] Config:', this.config);

    // Try WebSocket first if URL provided
    if (this.config.wsUrl) {
      console.log('[RealtimeService] Attempting WebSocket connection to:', this.config.wsUrl);
      const wsConnected = await this.connectWebSocket();
      if (wsConnected) {
        console.log('[RealtimeService] WebSocket connection successful');
        this.isConnecting = false;
        return;
      }
      console.log('[RealtimeService] WebSocket failed, falling back to polling');
    } else {
      console.log('[RealtimeService] No WebSocket URL provided, using polling only');
    }

    // Fallback to polling
    console.log('[RealtimeService] Starting polling mode');
    this.connectPolling();
    this.isConnecting = false;
  }

  /**
   * Attempt WebSocket connection
   */
  private connectWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log('[RealtimeService] Creating WebSocket instance...');
        this.ws = new WebSocket(this.config.wsUrl!);
        console.log('[RealtimeService] WebSocket created, waiting for connection...');
        
        const timeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            console.error('[RealtimeService] WebSocket timeout after 3 seconds');
            console.log('[RealtimeService] WebSocket state:', this.ws?.readyState);
            this.ws?.close();
            console.log('[RealtimeService] WebSocket timeout, falling back to polling');
            resolve(false);
          }
        }, 3000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.mode = 'websocket';
          this.reconnectAttempts = 0;
          console.log('[RealtimeService] WebSocket connected successfully!');
          console.log('[RealtimeService] Emitting connection event: websocket');
          this.emit('connection', { mode: 'websocket', status: 'connected' });
          this.startPingPong();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              this.latency = performance.now() - this.lastPingTime;
              console.log(`[RealtimeService] Latency: ${this.latency.toFixed(2)}ms`);
              this.emit('latency', { latency: Math.round(this.latency) });
            } else {
              this.handleMessage(data);
            }
          } catch (error) {
            console.error('[RealtimeService] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('[RealtimeService] WebSocket error event:', error);
          console.error('[RealtimeService] WebSocket URL was:', this.config.wsUrl);
          console.log('[RealtimeService] WebSocket error, using polling');
          resolve(false);
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          if (this.mode === 'websocket') {
            console.log('[RealtimeService] WebSocket closed, switching to polling');
            this.mode = 'disconnected';
            this.connectPolling();
          }
        };
      } catch (error) {
        console.error('[RealtimeService] WebSocket connection exception:', error);
        console.error('[RealtimeService] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          wsUrl: this.config.wsUrl
        });
        resolve(false);
      }
    });
  }

  /**
   * Start HTTP polling
   */
  private connectPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.mode = 'polling';
    console.log('[RealtimeService] Using HTTP polling mode');
    this.emit('connection', { mode: 'polling', status: 'connected' });

    // Initial fetch
    this.pollData();

    // Set up interval
    this.pollingInterval = window.setInterval(() => {
      this.pollData();
    }, this.config.pollingInterval);
  }

  /**
   * Poll data from HTTP endpoint
   */
  private async pollData(): Promise<void> {
    try {
      const url = new URL(this.config.pollingUrl, window.location.origin);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.type === 'update') {
          this.handleMessage(data);
        }
      }
    } catch (error) {
      console.error('[RealtimeService] Polling failed:', error);
    }
  }



  /**
   * Handle incoming message
   */
  private handleMessage(data: any): void {
    const { type, ...payload } = data;
    
    if (type && this.handlers.has(type)) {
      this.handlers.get(type)!.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[RealtimeService] Handler error for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit event to handlers
   */
  private emit(event: string, data: any): void {
    if (this.handlers.has(event)) {
      this.handlers.get(event)!.forEach(handler => handler(data));
    }
  }

  /**
   * Send message (WebSocket only)
   */
  send(type: string, data: any): void {
    if (this.mode === 'websocket' && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    } else {
      console.warn('[RealtimeService] Cannot send message, not connected via WebSocket');
    }
  }

  /**
   * Get current connection mode
   */
  getMode(): ConnectionMode {
    return this.mode;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.mode !== 'disconnected';
  }

  /**
   * Start ping-pong for latency measurement
   */
  private startPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    const interval = (window as any).appointeaseSettings?.wsPingInterval || 1;
    const intervalMs = interval * 1000;

    this.pingInterval = window.setInterval(() => {
      if (this.mode === 'websocket' && this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = performance.now();
        this.send('ping', {});
      }
    }, intervalMs);
  }

  /**
   * Get current latency
   */
  getLatency(): number {
    return this.latency;
  }

  /**
   * Disconnect from service
   */
  disconnect(): void {
    // Stop ping-pong
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.mode = 'disconnected';
    this.emit('connection', { mode: 'disconnected', status: 'disconnected' });
    console.log('[RealtimeService] Disconnected');
  }
}

/**
 * Create realtime service instance
 */
export const createRealtimeService = (config: RealtimeConfig): RealtimeService => {
  return new RealtimeService(config);
};
