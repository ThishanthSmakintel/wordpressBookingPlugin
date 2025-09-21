import { Service, Employee, Appointment } from '../types';

interface AvailabilityResponse {
  unavailable: string[] | 'all';
  reason?: string;
}

class ApiService {
  private baseUrl: string;
  private nonce: string;

  constructor() {
    this.baseUrl = window.bookingAPI?.root || '/wp-json/';
    this.nonce = (window as any).bookingApiSettings?.nonce || window.bookingAPI?.nonce || '';
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

  private async publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
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

  async checkAvailability(data: { date: string; employee_id: number }): Promise<AvailabilityResponse> {
    return this.request<AvailabilityResponse>('booking/v1/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkCustomer(email: string): Promise<{exists: boolean; name?: string; phone?: string}> {
    return this.publicRequest(`booking/v1/check-customer/${encodeURIComponent(email)}`, {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();

// Export individual functions for easier imports
export const getServices = () => apiService.getServices();
export const getEmployees = () => apiService.getEmployees();
export const getUserAppointments = (email: string) => apiService.getUserAppointments(email);
export const createAppointment = (data: any) => apiService.createAppointment(data);
export const cancelAppointment = (id: string) => apiService.cancelAppointment(id);
export const rescheduleAppointment = (id: string, newDate: string) => apiService.rescheduleAppointment(id, newDate);
export const checkAvailability = (data: { date: string; employee_id: number }): Promise<AvailabilityResponse> => apiService.checkAvailability(data);
export const checkCustomer = (email: string) => apiService.checkCustomer(email);