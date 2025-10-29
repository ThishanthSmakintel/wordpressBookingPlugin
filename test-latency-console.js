/**
 * AppointEase React Frontend Latency Test
 * 
 * Usage:
 * 1. Open booking page in browser
 * 2. Open DevTools Console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: await runLatencyTest()
 */

async function runLatencyTest() {
    console.clear();
    console.log('⚡ Starting React Frontend Latency Test...\n');
    
    const metrics = [];
    const apiBase = '/wp-json/appointease/v1';
    
    // Helper to measure operation
    const measure = async (name, fn) => {
        const start = performance.now();
        let success = true;
        let error = null;
        
        try {
            await fn();
        } catch (e) {
            success = false;
            error = e.message;
        }
        
        const duration = performance.now() - start;
        metrics.push({ name, duration, success, error });
        
        const status = success ? '✅' : '❌';
        const color = duration < 10 ? 'color: #10b981' : duration < 50 ? 'color: #f59e0b' : 'color: #ef4444';
        console.log(`${status} %c${name}: ${duration.toFixed(2)}ms`, color);
        
        return { duration, success };
    };
    
    const clientId = `test_${Date.now()}`;
    const date = '2024-01-15';
    const employeeId = 1;
    
    console.log('📋 Test Configuration:');
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Date: ${date}`);
    console.log(`   Employee ID: ${employeeId}\n`);
    
    // Test 1: API - Slot Selection
    console.log('🔹 Test 1: Slot Selection API');
    await measure('API: Select Slot', async () => {
        const response = await fetch(`${apiBase}/slots/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, time: '09:00', employee_id: employeeId, client_id: clientId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });
    
    // Test 2: API - Rapid Slot Changes
    console.log('\n🔹 Test 2: Rapid Slot Changes (10x)');
    const changeStart = performance.now();
    for (let i = 0; i < 10; i++) {
        const time = `${9 + Math.floor(i / 6)}:${String((i % 6) * 10).padStart(2, '0')}`;
        await measure(`  Change ${i + 1} (${time})`, async () => {
            const response = await fetch(`${apiBase}/slots/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, time, employee_id: employeeId, client_id: clientId })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        });
    }
    const changeTotal = performance.now() - changeStart;
    console.log(`   Total: ${changeTotal.toFixed(2)}ms | Avg: ${(changeTotal / 10).toFixed(2)}ms`);
    
    // Test 3: API - Slot Deselection
    console.log('\n🔹 Test 3: Slot Deselection');
    await measure('API: Deselect Slot', async () => {
        const response = await fetch(`${apiBase}/slots/deselect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, time: '10:00', employee_id: employeeId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });
    
    // Test 4: WordPress Heartbeat Latency
    console.log('\n🔹 Test 4: WordPress Heartbeat');
    await measure('Heartbeat: Single Tick', () => {
        return new Promise(resolve => {
            if (typeof wp === 'undefined' || !wp.heartbeat) {
                throw new Error('WordPress Heartbeat not available');
            }
            
            const handler = (e, data) => {
                wp.heartbeat.off('tick', handler);
                resolve();
            };
            
            wp.heartbeat.on('tick', handler);
            wp.heartbeat.connectNow();
        });
    });
    
    // Test 5: Component Re-render Simulation
    console.log('\n🔹 Test 5: React Component Re-render');
    await measure('React: State Update + Re-render', async () => {
        // Simulate state update
        const stateStart = performance.now();
        await fetch(`${apiBase}/slots/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, time: '11:00', employee_id: employeeId, client_id: clientId })
        });
        
        // Wait for React to process state update
        await new Promise(r => setTimeout(r, 16)); // ~1 frame at 60fps
        
        return performance.now() - stateStart;
    });
    
    // Test 6: DOM Query Performance
    console.log('\n🔹 Test 6: DOM Operations');
    await measure('DOM: Query Time Slots', () => {
        const slots = document.querySelectorAll('[class*="time-slot"], [class*="TimeSlot"]');
        return slots.length;
    });
    
    // Test 7: Network Latency (Availability Check)
    console.log('\n🔹 Test 7: Network Latency');
    await measure('API: Check Availability', async () => {
        const response = await fetch('/wp-json/booking/v1/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, employee_id: employeeId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });
    
    // Test 8: localStorage Performance
    console.log('\n🔹 Test 8: localStorage Operations');
    await measure('localStorage: Read/Write', () => {
        const key = 'appointease_test';
        localStorage.setItem(key, JSON.stringify({ test: true, timestamp: Date.now() }));
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.removeItem(key);
        return data;
    });
    
    // Calculate Statistics
    console.log('\n📊 Summary Statistics:');
    const durations = metrics.filter(m => m.success).map(m => m.duration).sort((a, b) => a - b);
    const failed = metrics.filter(m => !m.success).length;
    
    const stats = {
        total: metrics.length,
        successful: metrics.length - failed,
        failed,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: durations[0],
        max: durations[durations.length - 1],
        p50: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)]
    };
    
    console.table({
        'Total Tests': stats.total,
        'Successful': stats.successful,
        'Failed': stats.failed,
        'Avg Latency': `${stats.avg.toFixed(2)}ms`,
        'Min': `${stats.min.toFixed(2)}ms`,
        'Max': `${stats.max.toFixed(2)}ms`,
        'P50 (Median)': `${stats.p50.toFixed(2)}ms`,
        'P95': `${stats.p95.toFixed(2)}ms`,
        'P99': `${stats.p99.toFixed(2)}ms`
    });
    
    // Performance Analysis
    console.log('\n🔍 Performance Analysis:');
    const excellent = metrics.filter(m => m.success && m.duration < 10).length;
    const good = metrics.filter(m => m.success && m.duration >= 10 && m.duration < 50).length;
    const slow = metrics.filter(m => m.success && m.duration >= 50).length;
    
    console.log(`   %c✅ Excellent (<10ms): ${excellent}`, 'color: #10b981');
    console.log(`   %c⚠️  Good (10-50ms): ${good}`, 'color: #f59e0b');
    console.log(`   %c❌ Slow (>50ms): ${slow}`, 'color: #ef4444');
    
    // Bottleneck Detection
    console.log('\n🚨 Potential Bottlenecks:');
    const bottlenecks = metrics.filter(m => m.success && m.duration > 50).sort((a, b) => b.duration - a.duration);
    if (bottlenecks.length > 0) {
        bottlenecks.forEach(b => {
            console.log(`   %c${b.name}: ${b.duration.toFixed(2)}ms`, 'color: #ef4444; font-weight: bold');
        });
    } else {
        console.log('   %c✅ No bottlenecks detected!', 'color: #10b981');
    }
    
    // Export Results
    console.log('\n💾 Export Results:');
    const exportData = { timestamp: new Date().toISOString(), metrics, stats };
    console.log('Copy this JSON to save results:');
    console.log(JSON.stringify(exportData, null, 2));
    
    return { metrics, stats };
}

// Auto-run if in browser console
console.log('📋 Latency Test Script Loaded');
console.log('Run: await runLatencyTest()');
