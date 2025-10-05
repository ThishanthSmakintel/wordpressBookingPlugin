import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeSelector from '../../../src/components/forms/TimeSelector';

// Mock Zustand store
jest.mock('../../../src/store/bookingStore', () => ({
  useBookingStore: () => ({
    selectedDate: '2025-01-15',
    selectedTime: '',
    selectedService: { duration: 30 },
    setSelectedTime: jest.fn(),
    setStep: jest.fn()
  })
}));

// Mock hooks
jest.mock('../../../src/hooks/useBookingState', () => ({
  useBookingState: () => ({})
}));

// Mock settings service
jest.mock('../../../src/app/shared/services/settings.service', () => ({
  SettingsService: {
    getInstance: () => ({
      getSettings: () => Promise.resolve({
        time_slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      })
    })
  }
}));

describe('TimeSelector Component', () => {
  const defaultProps = {
    unavailableSlots: [],
    timezone: 'UTC',
    bookingDetails: {},
    currentAppointment: null,
    isRescheduling: false
  };

  test('renders time slots correctly', async () => {
    render(<TimeSelector {...defaultProps} />);
    
    expect(screen.getByText('Choose Your Time')).toBeInTheDocument();
    
    // Wait for time slots to load
    await screen.findByText('09:00');
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  test('shows unavailable slots as booked', async () => {
    const props = {
      ...defaultProps,
      unavailableSlots: ['09:00', '10:00']
    };
    
    render(<TimeSelector {...props} />);
    
    await screen.findByText('09:00');
    expect(screen.getAllByText('Booked')).toHaveLength(2);
  });

  test('highlights current appointment in reschedule mode', async () => {
    const props = {
      ...defaultProps,
      isRescheduling: true,
      currentAppointment: {
        appointment_date: '2025-01-15 14:00:00'
      }
    };
    
    render(<TimeSelector {...props} />);
    
    expect(screen.getByText('Choose New Time')).toBeInTheDocument();
    await screen.findByText('Your Current Time');
  });

  test('allows selecting available time slots', async () => {
    const mockSetSelectedTime = jest.fn();
    const mockSetStep = jest.fn();
    
    jest.doMock('../../../src/store/bookingStore', () => ({
      useBookingStore: () => ({
        selectedDate: '2025-01-15',
        selectedTime: '',
        selectedService: { duration: 30 },
        setSelectedTime: mockSetSelectedTime,
        setStep: mockSetStep
      })
    }));
    
    render(<TimeSelector {...defaultProps} />);
    
    await screen.findByText('09:00');
    fireEvent.click(screen.getByText('09:00'));
    
    const nextButton = screen.getByText('Next: Confirm Booking →');
    fireEvent.click(nextButton);
    
    expect(mockSetSelectedTime).toHaveBeenCalledWith('09:00');
    expect(mockSetStep).toHaveBeenCalledWith(5);
  });
});