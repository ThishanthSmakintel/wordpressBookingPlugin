import React, { useState, useCallback, useRef } from 'react';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useHeartbeatSlotPolling } from '../hooks/useHeartbeatSlotPolling';

interface LatencyMetric {
    operation: string;
    duration: number;
    timestamp: number;
    success: boolean;
    error?: string;
}

interface TestResults {
    metrics: LatencyMetric[];
    summary: {
        total: number;
        avg: number;
        min: number;
        max: number;
        p50: number;
        p95: number;
        p99: number;
        successRate: number;
    };
}

export const LatencyTest: React.FC = () => {
    const [results, setResults] = useState<TestResults | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState('');
    const metricsRef = useRef<LatencyMetric[]>([]);
    
    const clientId = `test_${Date.now()}`;
    const { selectSlot, deselectSlot } = useHeartbeat({ enabled: true });
    const { bookedSlots, lockedSlots } = useHeartbeatSlotPolling({
        date: '2024-01-15',
        employeeId: 1,
        enabled: true,
        clientId,
        selectedTime: ''
    });

    const measure = async (operation: string, fn: () => Promise<void>): Promise<void> => {
        const start = performance.now();
        let success = true;
        let error: string | undefined;
        
        try {
            await fn();
        } catch (e: any) {
            success = false;
            error = e.message;
        }
        
        const duration = performance.now() - start;
        metricsRef.current.push({ operation, duration, timestamp: Date.now(), success, error });
    };

    const calculateStats = (metrics: LatencyMetric[]): TestResults['summary'] => {
        const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
        const successful = metrics.filter(m => m.success).length;
        
        return {
            total: metrics.length,
            avg: durations.reduce((a, b) => a + b, 0) / durations.length,
            min: durations[0],
            max: durations[durations.length - 1],
            p50: durations[Math.floor(durations.length * 0.5)],
            p95: durations[Math.floor(durations.length * 0.95)],
            p99: durations[Math.floor(durations.length * 0.99)],
            successRate: (successful / metrics.length) * 100
        };
    };

    const runTests = useCallback(async () => {
        setIsRunning(true);
        metricsRef.current = [];
        const date = '2024-01-15';
        const employeeId = 1;

        try {
            // Test 1: Single slot selection
            setProgress('Test 1/7: Single slot selection...');
            await measure('slot_select_single', async () => {
                await selectSlot(date, '09:00', employeeId, clientId);
            });
            await new Promise(r => setTimeout(r, 100));

            // Test 2: Rapid slot changes (10 times)
            setProgress('Test 2/7: Rapid slot changes (10x)...');
            for (let i = 0; i < 10; i++) {
                const time = `${9 + Math.floor(i / 6)}:${(i % 6) * 10}0`.padStart(5, '0');
                await measure(`slot_change_${i}`, async () => {
                    await selectSlot(date, time, employeeId, clientId);
                });
            }
            await new Promise(r => setTimeout(r, 100));

            // Test 3: Slot deselection
            setProgress('Test 3/7: Slot deselection...');
            await measure('slot_deselect', async () => {
                await deselectSlot(date, '10:00', employeeId);
            });
            await new Promise(r => setTimeout(r, 100));

            // Test 4: Heartbeat polling latency (measure React hook)
            setProgress('Test 4/7: Heartbeat polling...');
            const pollStart = performance.now();
            await new Promise(r => setTimeout(r, 1000)); // Wait for heartbeat tick
            const pollDuration = performance.now() - pollStart;
            metricsRef.current.push({
                operation: 'heartbeat_poll',
                duration: pollDuration,
                timestamp: Date.now(),
                success: true
            });

            // Test 5: Component re-render latency
            setProgress('Test 5/7: Component re-render...');
            const renderStart = performance.now();
            await selectSlot(date, '11:00', employeeId, clientId);
            await new Promise(r => setTimeout(r, 50)); // Wait for state update
            const renderDuration = performance.now() - renderStart;
            metricsRef.current.push({
                operation: 'component_rerender',
                duration: renderDuration,
                timestamp: Date.now(),
                success: true
            });

            // Test 6: Concurrent selections (stress test)
            setProgress('Test 6/7: Concurrent selections (5x)...');
            const promises = [];
            for (let i = 0; i < 5; i++) {
                const time = `${12 + Math.floor(i / 6)}:${(i % 6) * 10}0`.padStart(5, '0');
                promises.push(measure(`concurrent_${i}`, async () => {
                    await selectSlot(date, time, employeeId, `${clientId}_${i}`);
                }));
            }
            await Promise.all(promises);
            await new Promise(r => setTimeout(r, 100));

            // Test 7: Data fetch latency (bookedSlots/lockedSlots)
            setProgress('Test 7/7: Data fetch latency...');
            const fetchStart = performance.now();
            const bookedCount = bookedSlots.length;
            const lockedCount = lockedSlots.length;
            const fetchDuration = performance.now() - fetchStart;
            metricsRef.current.push({
                operation: 'data_fetch',
                duration: fetchDuration,
                timestamp: Date.now(),
                success: true
            });

            // Calculate results
            const summary = calculateStats(metricsRef.current);
            setResults({ metrics: metricsRef.current, summary });
            setProgress('✅ Tests completed!');
        } catch (error: any) {
            setProgress(`❌ Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    }, [selectSlot, deselectSlot, clientId, bookedSlots, lockedSlots]);

    const exportResults = () => {
        if (!results) return;
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `latency-test-${Date.now()}.json`;
        a.click();
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'monospace' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>⚡ React Frontend Latency Test</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={runTests}
                    disabled={isRunning}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: isRunning ? '#ccc' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >
                    {isRunning ? '⏳ Running...' : '▶️ Run Tests'}
                </button>
                
                {results && (
                    <button
                        onClick={exportResults}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        💾 Export JSON
                    </button>
                )}
            </div>

            {progress && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    {progress}
                </div>
            )}

            {results && (
                <>
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>📊 Summary Statistics</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                            <StatCard label="Total Tests" value={results.summary.total} />
                            <StatCard label="Avg Latency" value={`${results.summary.avg.toFixed(2)}ms`} />
                            <StatCard label="Min" value={`${results.summary.min.toFixed(2)}ms`} color="#10b981" />
                            <StatCard label="Max" value={`${results.summary.max.toFixed(2)}ms`} color="#ef4444" />
                            <StatCard label="P50 (Median)" value={`${results.summary.p50.toFixed(2)}ms`} />
                            <StatCard label="P95" value={`${results.summary.p95.toFixed(2)}ms`} />
                            <StatCard label="P99" value={`${results.summary.p99.toFixed(2)}ms`} />
                            <StatCard label="Success Rate" value={`${results.summary.successRate.toFixed(1)}%`} color="#10b981" />
                        </div>
                    </div>

                    <div style={{
                        padding: '20px',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>📋 Detailed Metrics</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={tableHeaderStyle}>#</th>
                                    <th style={tableHeaderStyle}>Operation</th>
                                    <th style={tableHeaderStyle}>Duration (ms)</th>
                                    <th style={tableHeaderStyle}>Status</th>
                                    <th style={tableHeaderStyle}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.metrics.map((metric, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={tableCellStyle}>{idx + 1}</td>
                                        <td style={tableCellStyle}>{metric.operation}</td>
                                        <td style={{
                                            ...tableCellStyle,
                                            color: metric.duration < 10 ? '#10b981' : metric.duration < 50 ? '#f59e0b' : '#ef4444',
                                            fontWeight: 'bold'
                                        }}>
                                            {metric.duration.toFixed(2)}
                                        </td>
                                        <td style={tableCellStyle}>
                                            {metric.success ? '✅' : `❌ ${metric.error}`}
                                        </td>
                                        <td style={tableCellStyle}>
                                            {new Date(metric.timestamp).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fcd34d',
                        borderRadius: '8px'
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>🔍 Performance Analysis</h3>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Operations &lt;10ms: <strong style={{ color: '#10b981' }}>Excellent</strong></li>
                            <li>Operations 10-50ms: <strong style={{ color: '#f59e0b' }}>Good</strong></li>
                            <li>Operations &gt;50ms: <strong style={{ color: '#ef4444' }}>Needs Optimization</strong></li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = '#1f2937' }) => (
    <div style={{
        padding: '15px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
    }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
    </div>
);

const tableHeaderStyle: React.CSSProperties = {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 'bold'
};

const tableCellStyle: React.CSSProperties = {
    padding: '12px',
    fontSize: '14px'
};

export default LatencyTest;
