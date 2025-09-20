import React from 'react';

interface TimeSyncProps {
    debugState: any;
    onContinue: () => void;
}

export const TimeSync: React.FC<TimeSyncProps> = ({ debugState, onContinue }) => {
    return (
        <div className="appointease-step-content">
            <div className="time-sync-container">
                <div className="sync-header">
                    <i className="ri-time-line" style={{fontSize: '3rem', color: '#1CBC9B', marginBottom: '1rem'}}></i>
                    <h2>Initializing Booking System</h2>
                    <p>Syncing time with server to ensure accurate scheduling...</p>
                </div>
                
                <div className="time-display">
                    <div className="current-time">
                        <div className="time-label">Current Time</div>
                        <div className="time-value">
                            {debugState.currentTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                timeZoneName: 'short'
                            })}
                        </div>
                        <div className="timezone-info">
                            {debugState.timeZone} • {debugState.currentTime.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
                
                {debugState.timeSynced && (
                    <div className="sync-complete">
                        <button 
                            className="continue-btn"
                            onClick={onContinue}
                            style={{
                                background: 'linear-gradient(135deg, #1CBC9B, #16a085)',
                                color: 'white',
                                border: 'none',
                                padding: '16px 32px',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(28, 188, 155, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="ri-arrow-right-line"></i> Start Booking
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};