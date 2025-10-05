export interface BusinessSettings {
  business_hours: {
    start: string;
    end: string;
  };
  working_days: string[];
  time_slots: string[];
  slot_duration: number;
}

export class SettingsService {
  private static instance: SettingsService;
  private settings: BusinessSettings | null = null;

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  async getSettings(): Promise<BusinessSettings> {
    if (this.settings) {
      return this.settings;
    }

    try {
      // Debug logging
      console.log('=== BOOKING DEBUG - SETTINGS SERVICE ===');
      console.log('[SettingsService] window.bookingAPI:', window.bookingAPI);
      
      // Wait for bookingAPI to be available (with timeout)
      let attempts = 0;
      while (!window.bookingAPI && attempts < 10) {
        console.log('[SettingsService] Waiting for bookingAPI...', attempts);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.bookingAPI) {
        // Try multiple fallback URLs
        console.warn('[SettingsService] bookingAPI not available, trying fallbacks');
        const fallbackUrls = [
          '/wp-json/appointease/v1/settings',
          '/wp-json/booking/v1/time-slots', 
          '/wp-json/appointease/v1/time-slots'
        ];
        
        for (const fallbackUrl of fallbackUrls) {
          console.log('=== BOOKING DEBUG - TRYING FALLBACK ===');
          console.log('[SettingsService] Trying fallback URL:', fallbackUrl);
          try {
            const response = await fetch(fallbackUrl, {
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('[SettingsService] Success with fallback:', fallbackUrl, data);
              
              // Convert time-slots response to settings format
              if (data.time_slots) {
                this.settings = {
                  business_hours: { start: '09:00', end: '17:00' },
                  working_days: ['1','2','3','4','5'],
                  time_slots: data.time_slots,
                  slot_duration: data.slot_duration || 60
                };
                return this.settings;
              }
            } else {
              const errorText = await response.text();
              console.error('[SettingsService] Fallback API failed:', fallbackUrl, response.status, errorText);
            }
          } catch (e) {
            console.error('[SettingsService] Fallback error:', fallbackUrl, e.message, e.stack);
          }
        }
        
        // If all fallbacks failed, throw detailed error
        throw new Error('All settings API endpoints failed. Check console for detailed errors.');
      }
      
      // Handle different API root configurations
      const baseUrl = window.bookingAPI.root;
      const apiUrls = [];
      
      // If root already includes appointease/v1/, use it directly
      if (baseUrl.includes('appointease/v1/')) {
        apiUrls.push(`${baseUrl}settings`);
        apiUrls.push(`${baseUrl}time-slots`);
        apiUrls.push(`${baseUrl}business-hours`);
      } else {
        // If root is just wp-json/, add the namespaces
        apiUrls.push(`${baseUrl}appointease/v1/settings`);
        apiUrls.push(`${baseUrl}booking/v1/settings`);
        apiUrls.push(`${baseUrl}appointease/v1/time-slots`);
        apiUrls.push(`${baseUrl}booking/v1/time-slots`);
      }
      
      console.log('[SettingsService] Base URL:', baseUrl);
      console.log('[SettingsService] Trying API URLs:', apiUrls);
      
      // Try each API URL until one works
      for (const apiUrl of apiUrls) {
        try {
          console.log('[SettingsService] Trying API URL:', apiUrl);
          
          const response = await fetch(apiUrl, {
            headers: {
              'Content-Type': 'application/json',
              'X-WP-Nonce': (window as any).bookingApiSettings?.nonce || window.bookingAPI.nonce
            }
          });

          console.log('[SettingsService] Response status:', response.status);
          console.log('[SettingsService] Response ok:', response.ok);

          if (response.ok) {
            const data = await response.json();
            console.log('[SettingsService] Response data:', data);
            
            // Convert time-slots response to settings format if needed
            if (data.time_slots && !data.business_hours) {
              this.settings = {
                business_hours: { start: '09:00', end: '17:00' },
                working_days: ['1','2','3','4','5'],
                time_slots: data.time_slots,
                slot_duration: data.slot_duration || 60
              };
            } else {
              this.settings = data;
            }
            
            return this.settings;
          } else {
            const errorText = await response.text();
            console.error('[SettingsService] API failed:', {
              url: apiUrl,
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              errorText: errorText
            });
          }
        } catch (error) {
          console.error('[SettingsService] API error:', {
            url: apiUrl,
            error: error.message,
            stack: error.stack,
            type: error.constructor.name
          });
        }
      }
      
      // If all API calls failed, throw detailed error
      throw new Error('All settings API endpoints failed. No valid response received.');
    } catch (error) {
      console.error('[SettingsService] Detailed Error Information:');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      
      // Create detailed error with all information
      const detailedError = new Error(`Settings API failed: ${error.message || 'Unknown error'}`);
      detailedError.originalError = error;
      detailedError.apiRoot = window.bookingAPI?.root || 'undefined';
      detailedError.timestamp = new Date().toISOString();
      throw detailedError;
    }
  }

  clearCache(): void {
    this.settings = null;
  }

  private generateTimeSlots(start: string, end: string, duration: number): string[] {
    const slots: string[] = [];
    const startTime = new Date(`2000-01-01 ${start}:00`);
    const endTime = new Date(`2000-01-01 ${end}:00`);
    
    let current = new Date(startTime);
    while (current < endTime) {
      const hours = current.getHours().toString().padStart(2, '0');
      const minutes = current.getMinutes().toString().padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
      current.setMinutes(current.getMinutes() + duration);
    }
    
    return slots;
  }

  // Debug method to check API availability
  async checkAPIAvailability(): Promise<boolean> {
    console.log('[SettingsService] Checking API availability...');
    console.log('[SettingsService] window.bookingAPI exists:', !!window.bookingAPI);
    
    // Wait a bit for bookingAPI to load
    let attempts = 0;
    while (!window.bookingAPI && attempts < 5) {
      console.log('[SettingsService] Waiting for bookingAPI...', attempts);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.bookingAPI) {
      console.log('[SettingsService] API root:', window.bookingAPI.root);
      console.log('[SettingsService] API nonce:', window.bookingAPI.nonce);
      return true;
    } else {
      console.log('[SettingsService] bookingAPI not available, will use fallback');
      return false;
    }
  }
}