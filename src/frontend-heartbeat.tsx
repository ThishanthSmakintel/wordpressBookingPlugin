import React from 'react';
import { createRoot } from 'react-dom/client';
import { BookingProvider } from './contexts/BookingContext';
import HeartbeatBookingForm from './components/HeartbeatBookingForm';
import HeartbeatAppointmentManager from './components/HeartbeatAppointmentManager';
import './frontend.css';
import './components/booking-components.css';
import './components/booking-summary.css';
import './components/appointment-dates.css';
import './components/appointment-header.css';
import './components/loading-states.css';

const HeartbeatBookingApp: React.FC = () => {
  const [mode, setMode] = React.useState<'booking' | 'manage'>('booking');
  const [userEmail, setUserEmail] = React.useState('');

  if (mode === 'manage' && userEmail) {
    return <HeartbeatAppointmentManager userEmail={userEmail} />;
  }

  return (
    <BookingProvider>
      <div className="heartbeat-booking-app">
        <div className="app-header">
          <button 
            className={mode === 'booking' ? 'active' : ''}
            onClick={() => setMode('booking')}
          >
            Book Appointment
          </button>
          <button 
            className={mode === 'manage' ? 'active' : ''}
            onClick={() => {
              const email = prompt('Enter your email to manage appointments:');
              if (email) {
                setUserEmail(email);
                setMode('manage');
              }
            }}
          >
            Manage Appointments
          </button>
        </div>
        
        {mode === 'booking' && <HeartbeatBookingForm />}
      </div>
    </BookingProvider>
  );
};

// Initialize the heartbeat booking app
const initHeartbeatApp = () => {
  const containers = document.querySelectorAll('.wp-block-appointease-booking-heartbeat');
  
  containers.forEach(container => {
    if (!container.hasAttribute('data-initialized')) {
      const root = createRoot(container);
      root.render(<HeartbeatBookingApp />);
      container.setAttribute('data-initialized', 'true');
    }
  });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeartbeatApp);
} else {
  initHeartbeatApp();
}