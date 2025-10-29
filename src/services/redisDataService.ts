/**
 * Redis-Primary Data Service
 * Primary: Redis for fast temporary data (slot locks, active selections, availability cache)
 * Fallback: WordPress Heartbeat + MySQL when Redis fails
 * NO WebSocket usage
 */

interface RedisDataServiceConfig {
  heartbeatEnabled: boolean;
  onDataUpdate?: (data: any) => void;
}

class RedisDataService {
  private heartbeatEnabled: boolean = false;
  private onDataUpdate?: (data: any) => void;
  private isRedisAvailable: boolean = true;

  constructor(config: RedisDataServiceConfig) {
    this.heartbeatEnabled = config.heartbeatEnabled;
    this.onDataUpdate = config.onDataUpdate;
    this.initHeartbeat();
  }

  private initHeartbeat() {
    if (!this.heartbeatEnabled || typeof window.wp === 'undefined') return;

    // Listen for heartbeat responses
    window.jQuery(document).on('heartbeat-tick', (e: any, data: any) => {
      // Check if Redis is available from backend response
      if (data.redis_status === 'unavailable') {
        this.isRedisAvailable = false;
        console.warn('[RedisData] Redis unavailable, using MySQL fallback');
      } else if (data.redis_status === 'available') {
        this.isRedisAvailable = true;
      }

      // Forward data updates
      if (this.onDataUpdate) {
        this.onDataUpdate(data);
      }
    });
  }

  /**
   * Select time slot - Redis primary, MySQL fallback (guest-friendly)
   */
  async selectSlot(date: string, time: string, employeeId: number, clientId: string): Promise<any> {
    try {
      const response = await fetch(`${window.bookingAPI?.root}appointease/v1/slots/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, employee_id: employeeId, client_id: clientId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.warn('[RedisData] Slot selection failed:', result.message);
        return { success: false, error: result.message };
      }

      return {
        success: true,
        storage: result.storage || (this.isRedisAvailable ? 'redis' : 'mysql'),
        ...result
      };
    } catch (error) {
      console.error('[RedisData] Slot selection error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Deselect time slot (guest-friendly)
   */
  async deselectSlot(date: string, time: string, employeeId: number): Promise<any> {
    try {
      const response = await fetch(`${window.bookingAPI?.root}appointease/v1/slots/deselect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, time, employee_id: employeeId })
      });

      return await response.json();
    } catch (error) {
      console.error('[RedisData] Slot deselection failed:', error);
      return { success: false };
    }
  }

  /**
   * Get availability - Redis cache primary, MySQL fallback
   */
  async getAvailability(date: string, employeeId: number): Promise<any> {
    try {
      const response = await fetch(`${window.bookingAPI?.root}appointease/v1/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.bookingAPI?.nonce
        },
        body: JSON.stringify({ date, employee_id: employeeId })
      });

      const result = await response.json();
      
      return {
        ...result,
        storage: result.storage || (this.isRedisAvailable ? 'redis' : 'mysql'),
        cached: result.cached || false
      };
    } catch (error) {
      console.error('[RedisData] Availability check failed:', error);
      throw error;
    }
  }

  /**
   * Get active selections - Redis primary
   */
  async getActiveSelections(date: string, employeeId: number): Promise<string[]> {
    try {
      const response = await fetch(
        `${window.bookingAPI?.root}appointease/v1/selections?date=${date}&employee_id=${employeeId}`,
        {
          headers: { 'X-WP-Nonce': window.bookingAPI?.nonce }
        }
      );

      const result = await response.json();
      return result.selections || [];
    } catch (error) {
      console.error('[RedisData] Failed to get selections:', error);
      return [];
    }
  }

  /**
   * Confirm booking - Atomic MySQL transaction
   */
  async confirmBooking(bookingData: any): Promise<any> {
    try {
      const idempotencyKey = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(`${window.bookingAPI?.root}appointease/v1/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          'X-WP-Nonce': window.bookingAPI?.nonce
        },
        body: JSON.stringify({
          ...bookingData,
          idempotency_key: idempotencyKey
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Booking failed');
      }

      return result;
    } catch (error) {
      console.error('[RedisData] Booking confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Check Redis status
   */
  isRedisEnabled(): boolean {
    return this.isRedisAvailable;
  }

  /**
   * Get storage mode
   */
  getStorageMode(): 'redis' | 'mysql' {
    return this.isRedisAvailable ? 'redis' : 'mysql';
  }
}

// Singleton instance
let redisDataServiceInstance: RedisDataService | null = null;

export const createRedisDataService = (config: RedisDataServiceConfig): RedisDataService => {
  if (!redisDataServiceInstance) {
    redisDataServiceInstance = new RedisDataService(config);
  }
  return redisDataServiceInstance;
};

export const getRedisDataService = (): RedisDataService | null => {
  return redisDataServiceInstance;
};
