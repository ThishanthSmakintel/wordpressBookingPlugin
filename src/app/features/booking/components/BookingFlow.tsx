import React, { useEffect } from 'react';
import { useAppointmentStore as useBookingStore } from '../../../../hooks/useAppointmentStore';
import { useBookingState } from '../../../../hooks/useBookingState';
import { StepWrapper } from '../../../shared/components/StepWrapper';
import { AppointmentSummary } from '../../../shared/components/AppointmentSummary';

// Legacy imports
import ServiceSelector from '../../../../components/forms/ServiceSelector';
import EmployeeSelector from '../../../../components/forms/EmployeeSelector';
import DateSelector from '../../../../components/forms/DateSelector';
import TimeSelector from '../../../../components/forms/TimeSelector';
import CustomerInfoForm from '../../../../components/forms/CustomerInfoForm';
import EmailVerification from '../../../../components/forms/EmailVerification';
import BookingSuccessPage from '../../../../components/pages/BookingSuccessPage';
import StepProgress from '../../../../components/ui/StepProgress';
import { SuccessPage } from '../../../shared/components/SuccessPage';
import { formatDate } from '../../../shared/utils/dateFormatters';

interface BookingFlowProps {
  loadInitialData: () => void;
  handleSubmit: () => void;
  checkCustomer: (email: string) => Promise<any>;
  setFormData: (data: any) => void;
  setStep: (step: number) => void;
  setErrors: (errors: any) => void;
  formData: any;
  columns?: number;
  isSubmitting: boolean;
  loadUserAppointmentsRealtime: (email?: string) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  loadInitialData,
  handleSubmit,
  checkCustomer,
  setFormData,
  setStep,
  setErrors,
  formData,
  columns,
  isSubmitting,
  loadUserAppointmentsRealtime
}) => {
  const { 
    step, 
    selectedDate, 
    selectedTime, 
    selectedService, 
    selectedEmployee,
    unavailableSlots,
    bookingDetails
  } = useBookingStore();
  const bookingState = useBookingState();

  // Auto-skip step 5 if logged in and not rescheduling
  useEffect(() => {
    if (step === 5 && bookingState.isLoggedIn && !bookingState.isRescheduling) {
      setFormData({
        email: bookingState.loginEmail,
        firstName: bookingState.loginEmail.split('@')[0],
        phone: ''
      });
      setStep(6);
    }
  }, [step, bookingState.isLoggedIn, bookingState.isRescheduling]);

  return (
    <div className="appointease-booking-content wp-block-group">
      {step <= 6 && step > 0 && <StepProgress />}
      
      {step === 1 && (
        <ServiceSelector
          onRetry={loadInitialData}
          columns={columns || 2}
        />
      )}

      {step === 2 && (
        <EmployeeSelector onRetry={loadInitialData} />
      )}

      {step === 3 && (
        <StepWrapper
          isReschedule={bookingState.isRescheduling}
          currentAppointment={bookingState.currentAppointment}
          stepDescription="Select a new date for your appointment"
        >
          <DateSelector isReschedule={bookingState.isRescheduling} />
        </StepWrapper>
      )}

      {step === 4 && (
        <TimeSelector
          unavailableSlots={unavailableSlots}
          timezone={bookingState.timezone}
          bookingDetails={bookingDetails}
          currentAppointment={bookingState.currentAppointment}
          isRescheduling={bookingState.isRescheduling}
        />
      )}



      {step === 5 && (
        <StepWrapper
          isReschedule={bookingState.isRescheduling}
          currentAppointment={bookingState.currentAppointment}
          stepDescription="Select a new date and time for your appointment"
        >
          {!bookingState.isRescheduling && !bookingState.isLoggedIn && !bookingState.showEmailVerification && (
            <CustomerInfoForm
              isLoggedIn={bookingState.isLoggedIn}
              isCheckingEmail={bookingState.isCheckingEmail}
              existingUser={bookingState.existingUser}
              onSubmit={handleSubmit}
              onBack={() => setStep(4)}
              checkExistingEmail={async (email: string) => {
                bookingState.setIsCheckingEmail(true);
                try {
                  const result = await checkCustomer(email);
                  if (result.exists) {
                    bookingState.setExistingUser({
                      exists: true,
                      name: result.name,
                      phone: result.phone
                    });
                    setFormData({
                      firstName: result.name || '',
                      phone: result.phone || ''
                    });
                  } else {
                    bookingState.setExistingUser({ exists: false });
                  }
                } catch (error) {
                  console.error('Error checking customer:', error);
                  bookingState.setExistingUser({ exists: false });
                } finally {
                  bookingState.setIsCheckingEmail(false);
                }
              }}
            />
          )}
          
          {!bookingState.isRescheduling && !bookingState.isLoggedIn && bookingState.showEmailVerification && (
            <EmailVerification
              emailOtp={bookingState.emailOtp}
              otpExpiry={bookingState.otpExpiry}
              resendCooldown={bookingState.resendCooldown}
              isBlocked={bookingState.isBlocked}
              isVerifyingEmail={bookingState.isVerifyingEmail}
              onOtpChange={bookingState.setEmailOtp}
              onVerifyOtp={() => {
                bookingState.setEmailVerified(true);
                bookingState.setShowEmailVerification(false);
                setStep(6);
              }}
              onResendOtp={() => {}}
              onBack={() => {
                bookingState.setShowEmailVerification(false);
                bookingState.setEmailOtp('');
                setErrors({});
              }}
            />
          )}
          
          {bookingState.isRescheduling && (
            <AppointmentSummary
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onBack={() => setStep(4)}
              onConfirm={() => {
                bookingState.setIsReschedulingSubmit(true);
                setTimeout(() => {
                  bookingState.setManageMode(false);
                  bookingState.setCurrentAppointment(null);
                  bookingState.setIsRescheduling(false);
                  setStep(9);
                  bookingState.setIsReschedulingSubmit(false);
                }, 1000);
              }}
              isSubmitting={bookingState.isReschedulingSubmit}
            />
          )}
        </StepWrapper>
      )}

      {step === 6 && (
        <div className="appointease-step-content">
          <div className="review-container">
            <h2>Review & Confirm</h2>
            <p className="step-description">Please review your appointment details before confirming</p>
            
            <div className="booking-summary">
              <h3>Appointment Summary</h3>
              <div className="summary-item">
                <span>Service:</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="summary-item">
                <span>Staff:</span>
                <span>{selectedEmployee?.name}</span>
              </div>
              <div className="summary-item">
                <span>Date:</span>
                <span>{formatDate(selectedDate)}</span>
              </div>
              <div className="summary-item">
                <span>Time:</span>
                <span>{selectedTime}</span>
              </div>
              <div className="summary-item">
                <span>Customer:</span>
                <span>{bookingState.isLoggedIn ? bookingState.loginEmail : `${formData.firstName} (${formData.email})`}</span>
              </div>
              <div className="summary-item total">
                <span>Total Price:</span>
                <span>${selectedService?.price}</span>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="back-btn" onClick={() => setStep(4)}>← Edit Time</button>
              <button type="button" className="confirm-btn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'BOOKING...' : 'CONFIRM BOOKING'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 7 && (
        <BookingSuccessPage
          appointmentId={bookingState.appointmentId}
          onBookAnother={() => {
            setStep(1);
            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
            bookingState.setAppointmentId('');
            bookingState.setExistingUser({ exists: false });
            setErrors({});
          }}
        />
      )}

      {step === 8 && (
        <SuccessPage
          type="cancellation"
          email={bookingState.currentAppointment?.email || bookingState.loginEmail}
          onPrimaryAction={() => {
            if (bookingState.isLoggedIn) {
              bookingState.setShowDashboard(true);
              loadUserAppointmentsRealtime(bookingState.loginEmail);
            } else {
              setStep(1);
              setFormData({ firstName: '', lastName: '', email: '', phone: '' });
              bookingState.setAppointmentId('');
              bookingState.setManageMode(false);
              bookingState.setCurrentAppointment(null);
              bookingState.setSessionToken(null);
              bookingState.setExistingUser({ exists: false });
              setErrors({});
            }
          }}
          primaryActionText={bookingState.isLoggedIn ? 'Show All Bookings' : 'Back to Booking'}
        />
      )}

      {step === 9 && (
        <SuccessPage
          type="reschedule"
          appointmentId={bookingState.currentAppointment?.id}
          email={bookingState.loginEmail}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onPrimaryAction={() => {
            if (bookingState.isLoggedIn) {
              bookingState.setShowDashboard(true);
              loadUserAppointmentsRealtime(bookingState.loginEmail);
            } else {
              setStep(1);
              setFormData({ firstName: '', lastName: '', email: '', phone: '' });
              bookingState.setAppointmentId('');
              bookingState.setManageMode(false);
              bookingState.setCurrentAppointment(null);
              bookingState.setIsRescheduling(false);
              bookingState.setSessionToken(null);
              bookingState.setExistingUser({ exists: false });
              setErrors({});
            }
          }}
          primaryActionText={bookingState.isLoggedIn ? 'Show All Bookings' : 'Book Another'}
        />
      )}
    </div>
  );
};
