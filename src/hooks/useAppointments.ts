import { useCallback } from 'react';
import { useAPI } from './useAPI';
import { useBookingStore } from '../store/bookingStore';

export const useAppointments = () => {
  const { appointments, setAppointments, setAppointmentsLoading } = useBookingStore();
  const { request } = useAPI<any>();

  const loadUserAppointments = useCallback(async (email: string) => {
    setAppointmentsLoading(true);
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
      console.error('Failed to load appointments:', error instanceof Error ? error.message : 'Unknown error');
      setAppointments([]);
      return [];
    } finally {
      setAppointmentsLoading(false);
    }
  }, [request, setAppointments, setAppointmentsLoading]);

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    try {
      await request('appointease/v1/cancel', {
        method: 'POST',
        body: JSON.stringify({ appointment_id: appointmentId })
      });
      
      setAppointments(
        appointments.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to cancel appointment:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [request, appointments, setAppointments]);

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
      
      setAppointments(
        appointments.map(apt =>
          apt.id === appointmentId
            ? { ...apt, date: `${newDate} ${newTime}` }
            : apt
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to reschedule appointment:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [request, appointments, setAppointments]);

  return {
    loadUserAppointments,
    cancelAppointment,
    rescheduleAppointment
  };
};