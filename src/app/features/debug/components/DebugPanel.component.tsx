import React from 'react';

interface DebugPanelProps {
  debugState: any;
  bookingState: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ debugState, bookingState }) => {
  if (!debugState.showDebug) {
    return (
      <button onClick={() => debugState.setShowDebug(true)} style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '5px',
        fontSize: '12px',
        cursor: 'pointer',
        zIndex: 99999
      }}>🔍 Debug</button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      maxWidth: '400px',
      maxHeight: '70vh',
      overflow: 'auto',
      zIndex: 99999,
      fontFamily: 'monospace'
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
        <strong>🔍 BOOKING DEBUG</strong>
        <button onClick={() => debugState.setShowDebug(false)} style={{background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}}>✕</button>
      </div>
      
      <div style={{marginBottom: '8px'}}>
        <div style={{color: '#0ff'}}>📊 System Status:</div>
        <div>Online: {debugState.isOnline ? '✅' : '❌'}</div>
      </div>
      
      <div style={{borderTop: '1px solid #333', paddingTop: '8px'}}>
        <div style={{color: '#0ff'}}>📋 All Bookings ({debugState.allBookings?.length || 0}):</div>
        {!debugState.allBookings?.length ? (
          <div style={{color: '#888', fontSize: '10px'}}>No bookings found</div>
        ) : (
          <div style={{maxHeight: '120px', overflow: 'auto'}}>
            {debugState.allBookings.slice(0, 6).map((booking: any) => (
              <div key={booking.id} style={{
                fontSize: '9px',
                marginBottom: '2px',
                padding: '2px',
                background: booking.status === 'confirmed' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                borderRadius: '2px'
              }}>
                <div>👤 {booking.name} | 📧 {booking.email}</div>
                <div>📅 {new Date(booking.appointment_date).toLocaleDateString()}</div>
                <div>🏷 {booking.strong_id || `ID-${booking.id}`} | 🟢 {booking.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};