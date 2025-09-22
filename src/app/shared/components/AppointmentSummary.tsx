import React from 'react';
import { formatDate, formatTime } from '../utils/dateFormatters';

interface AppointmentSummaryProps {
  selectedDate: string;
  selectedTime: string;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  selectedDate,
  selectedTime,
  onBack,
  onConfirm,
  isSubmitting
}) => (
  <div className="reschedule-summary" style={{ width: '100%', boxSizing: 'border-box' }}>
    <div className="booking-summary" style={{
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#166534',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <i className="fas fa-calendar-check" style={{marginRight: '8px'}}></i>
        New Appointment Time
      </h3>
      <div className="summary-item" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #dcfce7'
      }}>
        <span style={{fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center'}}>
          <i className="fas fa-calendar" style={{marginRight: '8px', color: '#16a34a'}}></i>
          Date:
        </span>
        <span style={{fontWeight: '500', color: '#16a34a'}}>
          {formatDate(selectedDate)}
        </span>
      </div>
      <div className="summary-item" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0'
      }}>
        <span style={{fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center'}}>
          <i className="fas fa-clock" style={{marginRight: '8px', color: '#16a34a'}}></i>
          Time:
        </span>
        <span style={{fontWeight: '500', color: '#16a34a'}}>
          {formatTime(selectedTime)}
        </span>
      </div>
    </div>
    <div className="form-actions" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px'
    }}>
      <button type="button" className="back-btn" onClick={onBack} style={{
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center'
      }}>
        <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i>
        Back
      </button>
      <button type="button" className="confirm-btn" onClick={onConfirm} disabled={isSubmitting} style={{
        backgroundColor: isSubmitting ? '#d1d5db' : '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 32px',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center'
      }}>
        {isSubmitting ? (
          <>
            <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
            RESCHEDULING...
          </>
        ) : (
          <>
            <i className="fas fa-check" style={{marginRight: '8px'}}></i>
            CONFIRM RESCHEDULE
          </>
        )}
      </button>
    </div>
  </div>
);