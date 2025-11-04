import { createElement, useState, useEffect } from '@wordpress/element';

interface BlockHeaderProps {
    onLoginClick?: () => void;
}

export const BlockHeader = ({ onLoginClick }: BlockHeaderProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    return (
        <div className="appointease-booking-header">
            <div className="appointease-logo">
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
            <button 
                className="login-button"
                onClick={onLoginClick}
                style={{
                    background: '#1CBC9B',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(28, 188, 155, 0.2)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                }}
            >
                <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
                Existing Customer? Login Here
            </button>
        </div>
    );
};
