import React from 'react';

interface DebugPanelProps {
  debugState: any;
  bookingState: any;
  connectionMode?: 'websocket' | 'polling' | 'disconnected';
  activeSelections?: string[];
  pollingInterval?: number;
  storageMode?: 'redis' | 'mysql';
  redisHealth?: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = React.memo(({ debugState, bookingState, connectionMode = 'disconnected', storageMode = 'mysql', redisHealth = false }) => {
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
        <div style={{marginTop: '4px'}}>
          <span style={{color: '#ff0'}}>🔌 Real-time: </span>
          <span style={{color: '#0f0'}}>⚡ WP Heartbeat (1s)</span>
        </div>
        <div style={{marginTop: '4px'}}>
          <span style={{color: '#ff0'}}>💾 Storage: </span>
          {storageMode === 'redis' ? (
            <span style={{color: '#0f0'}}>⚡ Redis (Primary)</span>
          ) : (
            <span style={{color: '#fa0'}}>🗄️ MySQL (Fallback)</span>
          )}
        </div>
        <div style={{marginTop: '4px'}}>
          <span style={{color: '#ff0'}}>🏥 Redis Health: </span>
          {redisHealth ? (
            <span style={{color: '#0f0'}}>✅ Connected</span>
          ) : (
            <span style={{color: '#f00'}}>❌ Disconnected</span>
          )}
        </div>
      </div>
      
      <div style={{borderTop: '1px solid #333', paddingTop: '8px', marginBottom: '8px'}}>
        <div style={{color: '#0ff'}}>👁️ Watching Slots:</div>
        {!activeSelections || activeSelections.length === 0 ? (
          <div style={{color: '#888', fontSize: '10px'}}>None</div>
        ) : (
          <div style={{fontSize: '10px'}}>
            {activeSelections.map((slot: string) => (
              <div key={slot} style={{
                marginTop: '2px',
                padding: '3px 6px',
                background: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '3px',
                display: 'inline-block',
                marginRight: '4px'
              }}>
                👁️ {slot}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{borderTop: '1px solid #333', paddingTop: '8px'}}>
        <div style={{color: '#0ff'}}>📋 Bookings ({debugState.allBookings?.length || 0}):</div>
        {!debugState.allBookings?.length ? (
          <div style={{color: '#888', fontSize: '10px'}}>No bookings</div>
        ) : (
          <div style={{maxHeight: '100px', overflow: 'auto'}}>
            {debugState.allBookings.slice(0, 4).map((booking: any) => (
              <div key={booking.id} style={{
                fontSize: '9px',
                marginBottom: '3px',
                padding: '3px',
                background: booking.status === 'confirmed' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                borderRadius: '2px'
              }}>
                <div>👤 {booking.name}</div>
                <div>📅 {new Date(booking.appointment_date).toLocaleDateString()} | {booking.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if critical data changed
  return (
    prevProps.debugState.showDebug === nextProps.debugState.showDebug &&
    prevProps.storageMode === nextProps.storageMode &&
    prevProps.redisHealth === nextProps.redisHealth &&
    prevProps.activeSelections?.length === nextProps.activeSelections?.length &&
    prevProps.debugState.allBookings?.length === nextProps.debugState.allBookings?.length
  );
});