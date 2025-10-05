import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingFlow } from '../../../src/app/features/booking/components/BookingFlow';

// Mock all dependencies
jest.mock('../../../src/store/bookingStore');
jest.mock('../../../src/hooks/useBookingState');

describe('Booking Flow Integration', () => {
  const mockProps = {
    loadInitialData: jest.fn(),
    handleSubmit: jest.fn(),
    checkCustomer: jest.fn(),
    setFormData: jest.fn(),
    setStep: jest.fn(),
    setErrors: jest.fn(),
    formData: {},
    isSubmitting: false,
    loadUserAppointmentsRealtime: jest.fn()
  };

  beforeEach(() => {
    // Mock store state
    require('../../../src/store/bookingStore').useBookingStore.mockReturnValue({
      step: 1,
      selectedDate: '',
      selectedTime: '',
      selectedService: null,
      selectedEmployee: null,
      unavailableSlots: [],
      bookingDetails: {}
    });

    // Mock booking state
    require('../../../src/hooks/useBookingState').useBookingState.mockReturnValue({
      isRescheduling: false,
      currentAppointment: null,
      timezone: 'UTC'
    });
  });

  test('renders service selector on step 1', () => {
    render(<BookingFlow {...mockProps} />);
    expect(screen.getByTestId('service-selector')).toBeInTheDocument();
  });

  test('progresses through booking steps', async () => {
    const { rerender } = render(<BookingFlow {...mockProps} />);
    
    // Step 1 - Service Selection
    expect(screen.getByTestId('service-selector')).toBeInTheDocument();
    
    // Mock step progression
    require('../../../src/store/bookingStore').useBookingStore.mockReturnValue({
      step: 2,
      selectedService: { id: 1, name: 'Test Service' },
      selectedEmployee: null,
      selectedDate: '',
      selectedTime: '',
      unavailableSlots: [],
      bookingDetails: {}
    });
    
    rerender(<BookingFlow {...mockProps} />);
    
    // Step 2 - Employee Selection
    expect(screen.getByTestId('employee-selector')).toBeInTheDocument();
  });

  test('handles reschedule mode correctly', () => {
    require('../../../src/hooks/useBookingState').useBookingState.mockReturnValue({
      isRescheduling: true,
      currentAppointment: {
        id: 'APT-2025-000001',
        appointment_date: '2025-01-15 14:00:00'
      },
      timezone: 'UTC'
    });

    require('../../../src/store/bookingStore').useBookingStore.mockReturnValue({
      step: 4,
      selectedDate: '2025-01-15',
      selectedTime: '',
      selectedService: { id: 1, name: 'Test Service' },
      selectedEmployee: { id: 1, name: 'Test Staff' },
      unavailableSlots: ['09:00', '10:00'],
      bookingDetails: {}
    });

    render(<BookingFlow {...mockProps} />);
    
    expect(screen.getByText('Choose New Time')).toBeInTheDocument();
  });
});