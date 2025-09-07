import { useState, useCallback } from 'react';
import { useAPI } from './useAPI';

interface Appointment {
  id: string;
  service: string;
  staff: string;
  date: string;
  status: string;
  name: string;
  email: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { request } = useAPI<Appointment[]>();

  const loadUserAppointments = useCallback(async (email: string) => {
    try {
      const data = await request('appointease/v1/user-appointments', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      const formatted = (data || []).map((apt: any) => ({
        id: apt.strong_id || `AE${apt.id.toString().padStart(6, '0')}`,
        service: apt.service_name || 'Service',
        staff: apt.staff_name || 'Staff Member',
        date: apt.appointment_date,
        status: apt.status,
        name: apt.name,
        email: apt.email
      }));
      
      setAppointments(formatted);
      return formatted;
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
      return [];
    }
  }, [request]);

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    try {
      await request('appointease/v1/cancel', {
        method: 'POST',
        body: JSON.stringify({ appointment_id: appointmentId })
      });
      
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      return false;
    }
  }, [request]);

  const rescheduleAppointment = useCallback(async (
    appointmentId: string, 
    newDate: string, 
    newTime: string
  ) => {
    try {
      await request('appointease/v1/reschedule', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: appointmentId,
          new_date: newDate,
          new_time: newTime
        })
      });
      
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId
            ? { ...apt, date: `${newDate} ${newTime}` }
            : apt
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      return false;
    }
  }, [request]);

  return {
    appointments,
    loadUserAppointments,
    cancelAppointment,
    rescheduleAppointment
  };
};