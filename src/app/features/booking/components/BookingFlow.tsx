import React, { useEffect } from 'react';
import { useAppointmentStore as useBookingStore } from '../../../../hooks/useAppointmentStore';
import { useBookingState } from '../../../../hooks/useBookingState';
import { StepWrapper } from '../../../shared/components/StepWrapper';
import { AppointmentSummary } from '../../../shared/components/AppointmentSummary';
import { BookingTimer } from '../../../../components/BookingTimer';
import { useRealtimeService } from '../../../../hooks/useRealtimeService';

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
  bookingState: any;
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
  loadUserAppointmentsRealtime,
  bookingState
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
  const { send } = useRealtimeService();
  


  // Lock slot when reaching confirmation page (Step 6)
  useEffect(() => {
    if (step === 6 && selectedDate && selectedTime && selectedEmployee) {

      send('lock_slot', {
        date: selectedDate,
        time: selectedTime,
        employeeId: selectedEmployee.id
      });
    }
  }, [step, selectedDate, selectedTime, selectedEmployee, send]);

  // Auto-fill form data for logged in users
  useEffect(() => {
    if (step === 5 && bookingState.isLoggedIn && bookingState.loginEmail && !formData?.firstName) {
      checkCustomer(bookingState.loginEmail)
        .then(result => {
          if (result.exists && result.name) {
            setFormData({
              email: bookingState.loginEmail,
              firstName: result.name,
              phone: result.phone || formData?.phone || ''
            });
          } else {
            const emailPrefix = bookingState.loginEmail.split('@')[0];
            const cleanName = emailPrefix.replace(/[^a-zA-Z]/g, '') || 'User';
            setFormData({
              email: bookingState.loginEmail,
              firstName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
              phone: formData?.phone || ''
            });
          }
        })
        .catch(error => {

          const emailPrefix = bookingState.loginEmail.split('@')[0];
          const cleanName = emailPrefix.replace(/[^a-zA-Z]/g, '') || 'User';
          setFormData({
            email: bookingState.loginEmail,
            firstName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
            phone: formData?.phone || ''
          });
        });
    }
  }, [step, bookingState.isLoggedIn, bookingState.loginEmail, checkCustomer, setFormData]);

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
          {!bookingState.isRescheduling && !bookingState.showEmailVerification && (
            <CustomerInfoForm
              isLoggedIn={bookingState.isLoggedIn}
              isCheckingEmail={bookingState.isCheckingEmail}
              existingUser={bookingState.existingUser}
              onSubmit={handleSubmit}
              onBack={() => setStep(4)}
              bookingState={bookingState}
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
                      ...formData,
                      firstName: result.name || '',
                      phone: result.phone || ''
                    });
                  } else {
                    bookingState.setExistingUser({ exists: false });
                  }
                } catch (error) {

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
            
            {/* Debug Info */}
            <div style={{marginBottom: '1rem', padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace'}}>
              <div style={{color: '#3b82f6', fontWeight: 'bold', marginBottom: '4px'}}>🔒 Slot Lock Debug:</div>
              <div>Date: {selectedDate}</div>
              <div>Time: {selectedTime}</div>
              <div>Employee ID: {selectedEmployee?.id}</div>
              <div>Step: {step}</div>
              <div style={{marginTop: '4px', color: '#10b981'}}>✅ Lock message sent on mount</div>
            </div>
            
            <BookingTimer 
              duration={600000}
              onExpire={() => {
                setStep(4);
                setErrors({ time: 'Your slot reservation expired. Please select a new time.' });
              }}
            />
            
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
            </div>

            <div className="booking-summary" style={{ marginTop: '1.5rem' }}>
              <h3>Contact Information</h3>
              <div className="summary-item">
                <span>Name:</span>
                <span>{bookingState.isLoggedIn ? bookingState.loginEmail.split('@')[0] : formData.firstName}</span>
              </div>
              <div className="summary-item">
                <span>Email:</span>
                <span>{bookingState.isLoggedIn ? bookingState.loginEmail : formData.email}</span>
              </div>
              {formData.phone && (
                <div className="summary-item">
                  <span>Phone:</span>
                  <span>{formData.phone}</span>
                </div>
              )}
              <div className="summary-item total">
                <span>Total Price:</span>
                <span>{bookingState.isRescheduling ? 'No additional charge' : `$${selectedService?.price}`}</span>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="back-btn" onClick={() => setStep(4)}>← Edit Time</button>
              <button type="button" className="confirm-btn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (bookingState.isRescheduling ? 'RESCHEDULING...' : 'BOOKING...') : (bookingState.isRescheduling ? 'RESCHEDULE APPOINTMENT' : 'CONFIRM BOOKING')}
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
          email={bookingState.currentAppointment?.email || bookingState.loginEmail || formData.email}
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
