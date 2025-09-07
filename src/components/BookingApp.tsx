import React from 'react';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import ProgressIndicator from './ProgressIndicator';
import ServiceSelector from './ServiceSelector';
import StaffSelector from './StaffSelector';
import DateTimeSelector from './DateTimeSelector';
import BookingForm from './BookingForm';
import BookingSuccess from './BookingSuccess';

const BookingSteps: React.FC = () => {
  const { state } = useBooking();

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <ServiceSelector />;
      case 2:
        return <StaffSelector />;
      case 3:
        return <DateTimeSelector />;
      case 4:
        return <BookingForm />;
      case 5:
        return <BookingSuccess />;
      default:
        return <ServiceSelector />;
    }
  };

  return (
    <div className="booking-app">
      <ProgressIndicator />
      <div className="booking-content">
        {renderStep()}
      </div>
    </div>
  );
};

const BookingApp: React.FC = () => {
  return (
    <BookingProvider>
      <BookingSteps />
    </BookingProvider>
  );
};

export default BookingApp;