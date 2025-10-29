import React, { useState, useEffect } from 'react';
import { useAppointmentStore as useBookingStore } from '../hooks/useAppointmentStore';
import { useDebugStore } from '../hooks/useDebugStore';
import { useHeartbeat } from '../hooks/useHeartbeat';

// Auto-load debug data via heartbeat
const useAutoLoadDebugData = (debugState: any) => {
    useEffect(() => {
        // Don't create another heartbeat instance, data will come from main polling
        return () => {};
    }, []);
};

const StateTracker: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [storeStatus, setStoreStatus] = useState('unknown');
    
    useEffect(() => {
        const updateLogs = () => {
            const stateLogs = JSON.parse(sessionStorage.getItem('appointease_state_logs') || '[]');
            setLogs(stateLogs.slice(-10)); // Last 10 entries
            
            // Check store status
            const hasRecentReads = stateLogs.some(log => 
                log.action === 'STATE_READ' && 
                Date.now() - new Date(log.timestamp).getTime() < 5000
            );
            setStoreStatus(hasRecentReads ? 'active' : 'inactive');
        };
        
        updateLogs();
        const interval = setInterval(updateLogs, 1000);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div style={{fontSize: '9px'}}>
            <div>Store: <span style={{color: storeStatus === 'active' ? '#0f0' : '#f80'}}>{storeStatus}</span> | Logs: {logs.length}</div>
            <div style={{maxHeight: '60px', overflow: 'auto', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '2px'}}>
                {logs.map((log, i) => (
                    <div key={i} style={{fontSize: '8px', color: log.action.includes('error') ? '#f88' : '#8f8'}}>
                        {log.timestamp.split('T')[1].split('.')[0]} {log.action}: {JSON.stringify(log.data).slice(0, 50)}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface DebugPanelProps {
    debugState: any;
    bookingState: any;
    connectionMode?: 'websocket' | 'polling' | 'disconnected';
    wsLatency?: number;
    storageMode?: 'redis' | 'mysql';
    redisHealth?: boolean;
    heartbeatLatency?: number;
    redisOps?: { locks: number; selections: number; user_selection?: number };
    redisStats?: any;
    tempSelected?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ debugState, bookingState, connectionMode = 'disconnected', wsLatency = 0, storageMode = 'mysql', redisHealth = false, heartbeatLatency = 0, redisOps = { locks: 0, selections: 0, user_selection: 0 }, redisStats = null, tempSelected = '' }) => {
    const { step, selectedService, selectedEmployee, selectedDate, selectedTime, formData, serverDate, isOnline } = useBookingStore();
    const { showDebug, setShowDebug } = useDebugStore();
    useAutoLoadDebugData(debugState);
    

    // WebSocket debug removed - using WordPress Heartbeat API now

    if (!showDebug) {
        return (
            <button onClick={() => {
                setShowDebug(true);
                localStorage.setItem('appointease_debug_mode', 'true');
            }} style={{
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
            }} title="Ctrl+Shift+D to toggle">🔍 Debug</button>
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
                <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={async () => {
                        if (confirm('Clear all active slot locks?')) {
                            const response = await fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/clear-locks`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            const result = await response.json();
                            alert(`Cleared ${result.deleted_locks} locks, ${result.deleted_transients} transients, ${result.redis_cleared} Redis keys`);
                            window.location.reload();
                        }
                    }} style={{background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}} title="Clear All Locks">🗑️</button>
                    <button onClick={() => {
                        const logs = JSON.parse(sessionStorage.getItem('appointease_state_logs') || '[]');
                        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `appointease-state-logs-${new Date().toISOString().slice(0, 19)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }} style={{background: '#f59e0b', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}} title="Export State Logs">📄</button>
                    <button onClick={async () => {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const stepNames = ['service', 'employee', 'date', 'time', 'form', 'review', 'success', 'cancelled', 'rescheduled'];
                        const stepName = stepNames[step - 1] || 'unknown';
                        const userState = bookingState.isLoggedIn ? 'logged-in' : 'guest';
                        const mode = bookingState.isRescheduling ? 'reschedule' : 'booking';
                        const filename = `fullscreen-step-${step}-${stepName}-${mode}-${userState}-${timestamp}.png`;
                        
                        try {
                            const html2canvas = await import('html2canvas');
                            const canvas = await html2canvas.default(document.body, {
                                backgroundColor: '#ffffff',
                                scale: 1.5,
                                logging: false,
                                useCORS: true,
                                allowTaint: true,
                                width: window.innerWidth,
                                height: document.documentElement.scrollHeight
                            });
                            
                            const imageData = canvas.toDataURL('image/png');
                            
                            // Save to server
                            const response = await fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/screenshot/save`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    image: imageData,
                                    filename: filename,
                                    step: step,
                                    mode: mode,
                                    userState: userState,
                                    notes: `Auto-captured at step ${step}`
                                })
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                const notification = document.createElement('div');
                                notification.innerHTML = `✅ Screenshot saved to:<br/><small>debug-screenshots/${result.path}</small>`;
                                notification.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#10b981;color:#fff;padding:16px 24px;border-radius:8px;z-index:999999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);text-align:center';
                                document.body.appendChild(notification);
                                setTimeout(() => notification.remove(), 4000);
                            }
                        } catch (err) {
                            alert('Screenshot failed: ' + err.message);
                            console.error('Screenshot error:', err);
                        }
                    }} style={{background: '#10b981', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'}} title="Take Full Screen Screenshot">📸</button>
                    <button onClick={() => {
                        setShowDebug(false);
                        localStorage.setItem('appointease_debug_mode', 'false');
                    }} style={{background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}} title="Ctrl+Shift+D to toggle">✕</button>
                </div>
            </div>
            
            <div style={{marginBottom: '8px'}}>
                <div style={{color: '#0ff'}}>📊 System Status:</div>
                <div>Step: {step} | Employee: {selectedEmployee?.id || 'None'}</div>
                <div>Date: {selectedDate || 'None'} | Time: {selectedTime || 'None'}</div>
                <div>Server: {serverDate || 'Not synced'} | Online: {isOnline ? '✅' : '❌'}</div>
                <div>Logged In: {bookingState.isLoggedIn ? '✅' : '❌'} {bookingState.isLoggedIn && `(${bookingState.loginEmail})`}</div>

                <div style={{marginTop: '4px'}}>
                    <span style={{color: '#ff0'}}>🔌 Connection: </span>
                    <span style={{color: '#0f0'}}>✅ WP Heartbeat (1s)</span>
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
                {heartbeatLatency > 0 && (
                    <div style={{marginTop: '8px', padding: '8px', background: 'rgba(0,255,0,0.1)', borderRadius: '4px', border: '1px solid rgba(0,255,0,0.3)'}}>
                        <div style={{color: '#0f0', fontSize: '10px', marginBottom: '4px'}}>⚡ HEARTBEAT LATENCY</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#0f0'}}>{heartbeatLatency}ms</div>
                        <div style={{fontSize: '9px', color: '#8f8', marginTop: '2px'}}>Round-trip time</div>
                    </div>
                )}
                {storageMode === 'redis' && (
                    <div style={{marginTop: '8px', padding: '8px', background: 'rgba(255,165,0,0.1)', borderRadius: '4px', border: '1px solid rgba(255,165,0,0.3)'}}>
                        <div style={{color: '#fa0', fontSize: '10px', marginBottom: '4px'}}>⚡ REDIS LATENCY</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#fa0'}}>&lt;1ms</div>
                        <div style={{fontSize: '9px', color: '#fb8', marginTop: '2px'}}>Sub-millisecond ops</div>
                    </div>
                )}
                {storageMode === 'redis' && (
                    <div style={{marginTop: '8px', padding: '6px', background: 'rgba(255,165,0,0.1)', borderRadius: '4px'}}>
                        <div style={{color: '#fa0', fontSize: '10px', marginBottom: '4px'}}>📊 REDIS OPERATIONS</div>
                        <div style={{fontSize: '9px'}}>🔒 DB Locks: {redisOps?.locks || 0}</div>
                        <div style={{fontSize: '9px'}}>👁️ Other Users: {redisOps?.selections || 0}</div>
                        <div style={{fontSize: '9px'}}>✅ Your Selection: {redisOps?.user_selection || 0}{tempSelected ? ' (' + tempSelected + ')' : ''}</div>
                        <div style={{fontSize: '8px', color: '#888', marginTop: '2px'}}>Debug: {JSON.stringify(redisOps)}</div>

                        {debugState.activeSelections && debugState.activeSelections.length > 0 && (
                            <div style={{marginTop: '4px', fontSize: '8px', color: '#d97706'}}>
                                <div>🔴 Others Selecting: {debugState.activeSelections.join(', ')}</div>
                            </div>
                        )}
                    </div>
                )}
                {storageMode === 'redis' && redisStats && (
                    <div style={{marginTop: '8px', padding: '6px', background: 'rgba(0,255,255,0.1)', borderRadius: '4px'}}>
                        <div style={{color: '#0ff', fontSize: '10px', marginBottom: '4px'}}>📊 REDIS STATS</div>
                        <div style={{fontSize: '9px'}}>💾 Memory: {redisStats.used_memory}</div>
                        <div style={{fontSize: '9px'}}>🎯 Hit Rate: {redisStats.hit_rate}%</div>
                        <div style={{fontSize: '9px'}}>🔗 Clients: {redisStats.connected_clients}</div>
                        <div style={{fontSize: '9px'}}>⏱️ Uptime: {Math.floor(redisStats.uptime_seconds / 60)}m</div>
                    </div>
                )}
            </div>
            
            <div style={{marginBottom: '8px'}}>
                <div style={{color: '#0ff'}}>📅 Current Selection:</div>
                <div>Service: {selectedService?.name || 'None'}</div>
                <div>Staff: {selectedEmployee?.name || 'None'}</div>
                <div>Customer: {bookingState.isLoggedIn ? bookingState.loginEmail : formData.firstName || 'None'}</div>
            </div>
            
            {bookingState.isRescheduling && (
                <div style={{marginBottom: '8px', background: 'rgba(255,165,0,0.2)', padding: '5px', borderRadius: '3px'}}>
                    <div style={{color: '#ffa500'}}>🔄 RESCHEDULE MODE:</div>
                    <div>Current Apt: {bookingState.currentAppointment?.id || 'None'}</div>
                    <div>Original Date: {bookingState.currentAppointment?.appointment_date ? new Date(bookingState.currentAppointment.appointment_date).toLocaleDateString() : 'None'}</div>
                    <div>API Endpoint: reschedule-availability</div>
                    <div>Excluding: {bookingState.currentAppointment?.id || 'None'}</div>
                </div>
            )}
            
            <div style={{marginBottom: '8px'}}>
                <div style={{color: '#0ff'}}>💼 Database Config:</div>
                <div>Services: {debugState.debugServices.length} | Staff: {debugState.debugStaff.length}</div>
                <div>Working Days: [{debugState.workingDays.join(',')}]</div>
                <div>Time Slots: {debugState.debugTimeSlots.length} slots</div>
                <div>API Mode: {bookingState.isRescheduling ? 'RESCHEDULE' : 'NORMAL'}</div>
            </div>
            
            {storageMode === 'redis' && (
                <div style={{marginBottom: '8px', padding: '6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px'}}>
                    <div style={{color: '#10b981', fontSize: '10px', marginBottom: '4px'}}>⚡ REDIS REAL-TIME TRACKING</div>
                    <div style={{fontSize: '9px'}}>✅ Your Selection: {tempSelected || 'None'}</div>
                    <div style={{fontSize: '9px', marginTop: '2px'}}>👁️ Other Users Selecting: {debugState.activeSelections?.length || 0}</div>
                    {debugState.activeSelections && debugState.activeSelections.length > 0 && (
                        <div style={{fontSize: '8px', color: '#059669', marginTop: '2px'}}>
                            {debugState.activeSelections.map((slot: string) => (
                                <span key={slot} style={{marginRight: '4px', padding: '2px 4px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '2px'}}>{slot}</span>
                            ))}
                        </div>
                    )}
                    <div style={{fontSize: '9px', marginTop: '2px'}}>🔒 DB Locked Slots: {debugState.lockedSlots?.length || 0}</div>
                    <div style={{fontSize: '9px'}}>📊 Confirmed Bookings: {debugState.unavailableSlots?.length || 0}</div>
                </div>
            )}
            

            
            <div style={{marginBottom: '8px'}}>
                <div style={{color: '#0ff'}}>🔄 State Management:</div>
                <StateTracker />
            </div>
            


            <div style={{borderTop: '1px solid #333', paddingTop: '8px'}}>
                <div style={{color: '#0ff'}}>📋 All Bookings ({debugState.allBookings.length}):</div>
                {debugState.allBookings.length === 0 ? (
                    <div style={{color: '#888', fontSize: '10px'}}>No bookings found</div>
                ) : (
                    <div style={{maxHeight: '120px', overflow: 'auto'}}>
                        {debugState.allBookings.slice(0, 6).map((booking: any) => {
                            const isCurrentAppointment = bookingState.isRescheduling && 
                                (booking.strong_id === bookingState.currentAppointment?.id || 
                                 booking.id === bookingState.currentAppointment?.id);
                            
                            return (
                                <div key={booking.id} style={{
                                    fontSize: '9px',
                                    marginBottom: '2px',
                                    padding: '2px',
                                    background: isCurrentAppointment 
                                        ? 'rgba(255,165,0,0.3)' 
                                        : booking.status === 'confirmed' 
                                            ? 'rgba(0,255,0,0.1)' 
                                            : 'rgba(255,0,0,0.1)',
                                    border: isCurrentAppointment ? '1px solid #ffa500' : 'none',
                                    borderRadius: '2px'
                                }}>
                                    <div>👤 {booking.name} | 📧 {booking.email}</div>
                                    <div>📅 {new Date(booking.appointment_date).toLocaleDateString()} ⏰ {new Date(booking.appointment_date).toLocaleTimeString('en', {hour: '2-digit', minute: '2-digit'})}</div>
                                    <div>🏷 {booking.strong_id || `ID-${booking.id}`} | {isCurrentAppointment ? '🟠' : '🟢'} {booking.status} | 👨⚕️ Staff #{booking.employee_id}</div>
                                    {isCurrentAppointment && <div style={{color: '#ffa500', fontSize: '8px'}}>📍 CURRENT APPOINTMENT</div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
