import React from 'react';
import { useBookingStore } from '../store/bookingStore';

interface DebugPanelProps {
    debugState: any;
    bookingState: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ debugState, bookingState }) => {
    const { step, selectedService, selectedEmployee, selectedDate, selectedTime, formData, serverDate, isOnline } = useBookingStore();

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
                <div style={{display: 'flex', gap: '8px'}}>
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
                    <button onClick={() => debugState.setShowDebug(false)} style={{background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}}>✕</button>
                </div>
            </div>
            
            <div style={{marginBottom: '8px'}}>
                <div style={{color: '#0ff'}}>📊 System Status:</div>
                <div>Step: {step} | Employee: {selectedEmployee?.id || 'None'}</div>
                <div>Date: {selectedDate || 'None'} | Time: {selectedTime || 'None'}</div>
                <div>Server: {serverDate || 'Not synced'} | Online: {isOnline ? '✅' : '❌'}</div>
                <div>Logged In: {bookingState.isLoggedIn ? '✅' : '❌'} {bookingState.isLoggedIn && `(${bookingState.loginEmail})`}</div>
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