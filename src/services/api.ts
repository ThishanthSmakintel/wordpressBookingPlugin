import { Service, Employee, Appointment } from '../types';

class ApiService {
  private baseUrl: string;
  private nonce: string;

  constructor() {
    this.baseUrl = window.bookingAPI?.root || '/wp-json/';
    this.nonce = window.bookingAPI?.nonce || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': this.nonce,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('booking/v1/services');
  }

  async getEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('booking/v1/staff');
  }

  async getUserAppointments(email: string): Promise<Appointment[]> {
    return this.request<Appointment[]>('appointease/v1/user-appointments', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async createAppointment(data: {
    name: string;
    email: string;
    phone: string;
    date: string;
    service_id: number;
    employee_id: number;
  }) {
    return this.request('appointease/v1/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelAppointment(appointmentId: string) {
    return this.request(`appointease/v1/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
  }

  async rescheduleAppointment(appointmentId: string, newDate: string) {
    return this.request(`appointease/v1/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ new_date: newDate }),
    });
  }
}

export const apiService = new ApiService();