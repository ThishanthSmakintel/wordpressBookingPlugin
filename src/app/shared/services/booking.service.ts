import { Service, Employee, Appointment } from '../types/booking.types';

class BookingService {
  private baseUrl: string;
  private nonce: string;

  constructor() {
    this.baseUrl = window.bookingAPI?.root || '/wp-json/';
    this.nonce = window.bookingAPI?.nonce || '';
  }

  async getServices(): Promise<Service[]> {
    try {
      const response = await fetch(`${this.baseUrl}booking/v1/services`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return await response.json();
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async getStaff(): Promise<Employee[]> {
    try {
      const response = await fetch(`${this.baseUrl}booking/v1/staff`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      return await response.json();
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  }

  async checkAvailability(date: string, employeeId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}booking/v1/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': this.nonce
        },
        body: JSON.stringify({
          date: date,
          employee_id: employeeId
        })
      });
      
      if (!response.ok) throw new Error('Failed to check availability');
      return await response.json();
    } catch (error) {
      console.error('Error checking availability:', error);
      return { unavailable: [] };
    }
  }

  async createAppointment(appointmentData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}appointease/v1/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': this.nonce
        },
        body: JSON.stringify(appointmentData)
      });
      
      if (!response.ok) throw new Error('Failed to create appointment');
      return await response.json();
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async getUserAppointments(email: string): Promise<Appointment[]> {
    try {
      const response = await fetch(`${this.baseUrl}appointease/v1/user-appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': this.nonce
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) throw new Error('Failed to fetch user appointments');
      const appointments = await response.json();
      
      return (appointments || []).map((apt: any) => ({
        id: apt.strong_id || `AE${apt.id.toString().padStart(6, '0')}`,
        service: apt.service_name || 'Service',
        staff: apt.staff_name || 'Staff Member',
        date: apt.appointment_date,
        status: apt.status,
        name: apt.name,
        email: apt.email
      }));
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      return [];
    }
  }
}

export const bookingService = new BookingService();