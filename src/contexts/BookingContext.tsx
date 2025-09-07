import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface BookingState {
  step: number;
  selectedService: any;
  selectedEmployee: any;
  selectedDate: string;
  selectedTime: string;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  appointmentId: string;
  isLoading: boolean;
  errors: Record<string, string>;
}

type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_SERVICE'; payload: any }
  | { type: 'SET_EMPLOYEE'; payload: any }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_TIME'; payload: string }
  | { type: 'SET_FORM_DATA'; payload: Partial<BookingState['formData']> }
  | { type: 'SET_APPOINTMENT_ID'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'RESET_BOOKING' };

const initialState: BookingState = {
  step: 1,
  selectedService: null,
  selectedEmployee: null,
  selectedDate: '',
  selectedTime: '',
  formData: { firstName: '', lastName: '', email: '', phone: '' },
  appointmentId: '',
  isLoading: false,
  errors: {}
};

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_SERVICE':
      return { ...state, selectedService: action.payload };
    case 'SET_EMPLOYEE':
      return { ...state, selectedEmployee: action.payload };
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_TIME':
      return { ...state, selectedTime: action.payload };
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_APPOINTMENT_ID':
      return { ...state, appointmentId: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'RESET_BOOKING':
      return initialState;
    default:
      return state;
  }
};

const BookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
} | null>(null);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};