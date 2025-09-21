import React from 'react';

interface BookingHeaderProps {
  bookingState: any;
  onLogin: () => void;
  onDashboard: () => void;
  onLogout: () => void;
}

export const BookingHeader: React.FC<BookingHeaderProps> = ({ 
  bookingState, 
  onLogin, 
  onDashboard, 
  onLogout 
}) => {
  return (
    <div className="booking-header">
      <div className="logo">
        <span className="logo-icon">A</span>
      </div>
      
      {bookingState.isLoggedIn ? (
        <div className="user-menu">
          <button onClick={onDashboard}>
            <i className="fas fa-th-large"></i>
            <div className="user-info">
              <span>My Appointments</span>
            </div>
          </button>
          <button onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      ) : (
        <button onClick={onLogin} className="login-button">
          <i className="fas fa-sign-in-alt"></i>
          Existing Customer? Login Here
        </button>
      )}
    </div>
  );
};