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

      
      // Wait for bookingAPI to be available (with timeout)
      let attempts = 0;
      while (!window.bookingAPI && attempts < 10) {

        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.bookingAPI) {
        // Try settings endpoint
        const fallbackUrls = [
          '/wp-json/appointease/v1/settings'
        ];
        
        for (const fallbackUrl of fallbackUrls) {

          try {
            const response = await fetch(fallbackUrl, {
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();

              
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

            }
          } catch (e) {

          }
        }
        
        // If all fallbacks failed, throw detailed error
        throw new Error('All settings API endpoints failed. Check console for detailed errors.');
      }
      
      // Use settings endpoint only
      const baseUrl = window.bookingAPI.root;
      const apiUrls = [];
      
      if (baseUrl.includes('appointease/v1/')) {
        apiUrls.push(`${baseUrl}settings`);
      } else {
        apiUrls.push(`${baseUrl}appointease/v1/settings`);
      }
      

      
      // Try each API URL until one works
      for (const apiUrl of apiUrls) {
        try {

          
          const response = await fetch(apiUrl, {
            headers: {
              'Content-Type': 'application/json',
              'X-WP-Nonce': (window as any).bookingApiSettings?.nonce || window.bookingAPI.nonce
            }
          });



          if (response.ok) {
            const data = await response.json();

            
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

          }
        } catch (error) {

        }
      }
      
      // If all API calls failed, throw detailed error
      throw new Error('All settings API endpoints failed. No valid response received.');
    } catch (error) {

      
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

    
    // Wait a bit for bookingAPI to load
    let attempts = 0;
    while (!window.bookingAPI && attempts < 5) {

      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.bookingAPI) {

      return true;
    } else {

      return false;
    }
  }
}