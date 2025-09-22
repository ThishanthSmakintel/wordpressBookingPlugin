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
      const response = await fetch(`${window.bookingAPI.root}appointease/v1/settings`, {
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': (window as any).bookingApiSettings?.nonce || window.bookingAPI.nonce
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      this.settings = await response.json();
      return this.settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return fallback settings
      return {
        business_hours: { start: '09:00', end: '17:00' },
        working_days: ['1', '2', '3', '4', '5'],
        time_slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
        slot_duration: 30
      };
    }
  }

  clearCache(): void {
    this.settings = null;
  }
}