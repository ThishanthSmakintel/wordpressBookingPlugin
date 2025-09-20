import React from 'react';

interface BookingHeaderProps {
    bookingState: any;
    onLogin: () => void;
    onDashboard: () => void;
    onLogout: () => void;
}

export const BookingHeader: React.FC<BookingHeaderProps> = React.memo(({ 
    bookingState, 
    onLogin, 
    onDashboard, 
    onLogout 
}) => {
    const [currentTime, setCurrentTime] = React.useState(new Date());
    
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    return (
        <div className="appointease-booking-header wp-block-group is-layout-flex">
            <div className="appointease-logo wp-block-site-logo">
                <span className="logo-icon">A</span>
                <div className="current-time" style={{
                    fontSize: '0.85rem',
                    color: 'white',
                    marginTop: '4px',
                    fontWeight: '400'
                }}>
                    {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                    })} • {currentTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                        timeZoneName: 'short'
                    })}
                    <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.8)',
                        marginTop: '2px',
                        fontStyle: 'italic'
                    }}>
                        All bookings use this timezone
                    </div>
                </div>
            </div>
            {bookingState.isLoggedIn ? (
                <div className="user-menu wp-block-buttons is-layout-flex">
                    <button className="dashboard-btn wp-element-button" onClick={onDashboard}>
                        <i className="fas fa-th-large"></i>
                        <div className="dashboard-btn-content">
                            <span>My Appointments</span>
                            <span className="dashboard-btn-email">{bookingState.loginEmail}</span>
                        </div>
                    </button>
                    <button className="logout-btn wp-element-button" onClick={onLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            ) : (
                <button 
                    onClick={onLogin}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: 'none',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className="fas fa-sign-in-alt" style={{marginRight: '8px'}}></i>
                    Existing Customer? Login Here
                </button>
            )}
        </div>
    );
});