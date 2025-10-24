import React, { useState, useEffect } from 'react';

interface BookingTimerProps {
    onExpire: () => void;
    lockDuration?: number; // milliseconds
}

export const BookingTimer: React.FC<BookingTimerProps> = ({ onExpire, lockDuration = 600000 }) => {
    const [timeLeft, setTimeLeft] = useState(lockDuration);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1000) {
                    setExpired(true);
                    onExpire();
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [onExpire]);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const isUrgent = timeLeft < 120000; // Less than 2 minutes

    if (expired) {
        return (
            <div style={{
                padding: '16px',
                background: '#fee2e2',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                    ⏰ Time Expired
                </div>
                <div style={{ fontSize: '14px', color: '#991b1b' }}>
                    Your booking slot has been released. Please select a new time.
                </div>
            </div>
        );
    }

    return (
        <div style={{
            padding: '16px',
            background: isUrgent ? '#fef3c7' : '#dbeafe',
            border: `2px solid ${isUrgent ? '#f59e0b' : '#3b82f6'}`,
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px'
        }}>
            <div style={{ fontSize: '14px', color: isUrgent ? '#92400e' : '#1e40af', marginBottom: '8px' }}>
                {isUrgent ? '⚠️ Hurry! Time running out' : '⏱️ Time remaining to confirm'}
            </div>
            <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: isUrgent ? '#d97706' : '#2563eb',
                fontFamily: 'monospace'
            }}>
                {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: '12px', color: isUrgent ? '#92400e' : '#1e40af', marginTop: '4px' }}>
                {isUrgent 
                    ? 'Complete your booking now or the slot will be released!' 
                    : 'Please confirm your booking within this time'}
            </div>
        </div>
    );
};
