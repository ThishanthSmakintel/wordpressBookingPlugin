import React from 'react';

interface CurrentTimeWidgetProps {
    debugState: any;
}

export const CurrentTimeWidget: React.FC<CurrentTimeWidgetProps> = ({ debugState }) => {
    return (
        <div className="current-time-widget" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            fontSize: '0.85rem',
            color: '#374151',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{fontWeight: '600', marginBottom: '2px'}}>
                {debugState.currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
            <div style={{fontSize: '0.75rem', opacity: 0.7}}>
                {debugState.timeZone}
            </div>
        </div>
    );
};