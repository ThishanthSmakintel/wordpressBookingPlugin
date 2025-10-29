import React, { useState, useEffect } from 'react';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useHeartbeatSlotPolling } from '../hooks/useHeartbeatSlotPolling';

const HeartbeatTest: React.FC = () => {
    const [clientId] = useState(() => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const testDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const testEmployeeId = 1;

    const { isConnected, storageMode, latency, redisOps } = useHeartbeat({ enabled: true });
    
    const { 
        activeSelections, 
        bookedSlots, 
        lockedSlots, 
        pollCount 
    } = useHeartbeatSlotPolling({
        date: testDate,
        employeeId: testEmployeeId,
        enabled: true,
        clientId: clientId,
        selectedTime: ''
    });

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h1 style={{ margin: '0 0 10px 0' }}>🧪 React Heartbeat Test</h1>
                <p style={{ margin: 0, color: '#666' }}>Testing real React hooks</p>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>System Status</h2>
                
                <div style={{ padding: '10px', borderRadius: '4px', marginBottom: '10px', background: isConnected ? '#d4edda' : '#f8d7da', color: isConnected ? '#155724' : '#721c24' }}>
                    {isConnected ? '✅ Heartbeat Connected' : '❌ Heartbeat Disconnected'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Storage Mode:</span>
                    <strong>{storageMode || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Latency:</span>
                    <strong>{latency}ms</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Poll Count:</span>
                    <strong>{pollCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Client ID:</span>
                    <strong style={{ fontSize: '11px' }}>{clientId}</strong>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Redis Operations</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Database Locks:</span>
                    <strong>{redisOps.locks}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Active Selections:</span>
                    <strong>{redisOps.selections}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>User Selection:</span>
                    <strong>{redisOps.user_selection}</strong>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Slot Status</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Active Selections:</span>
                    <strong>{activeSelections.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Booked Slots:</span>
                    <strong>{bookedSlots.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Locked Slots:</span>
                    <strong>{lockedSlots.length}</strong>
                </div>
                
                {pollCount > 0 && (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#d4edda', borderRadius: '4px', color: '#155724' }}>
                        ✅ Heartbeat working! Received {pollCount} polls
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeartbeatTest;
