<?php
/**
 * Real-Time Polling System Test Script
 * Pure JavaScript/API testing - No WordPress loading required
 * 
 * Usage: http://blog.promoplus.com/wp-content/plugins/wordpressBookingPlugin/test-polling.php
 */
?>
<!DOCTYPE html>
<html>
<head>
    <title>AppointEase Polling Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; background: #f9fafb; }
        .test-section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .success { color: #10b981; font-weight: bold; }
        .error { color: #ef4444; font-weight: bold; }
        .info { color: #3b82f6; }
        button { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; font-size: 14px; }
        button:hover { background: #2563eb; }
        button:active { transform: scale(0.98); }
        pre { background: #1f2937; color: #10b981; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 13px; }
        .status { padding: 5px 10px; border-radius: 3px; display: inline-block; margin: 5px 0; font-size: 14px; }
        .status.pass { background: #d1fae5; color: #065f46; }
        .status.fail { background: #fee2e2; color: #991b1b; }
        .status.pending { background: #e5e7eb; color: #6b7280; }
        #log { max-height: 400px; overflow-y: auto; font-size: 13px; }
        input { padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; }
        h1 { color: #1f2937; }
        h2 { color: #374151; font-size: 18px; margin-top: 0; }
        .config-row { margin: 10px 0; }
        .config-row label { display: inline-block; width: 150px; font-weight: 500; }
    </style>
</head>
<body>
    <h1>🧪 AppointEase Real-Time Polling Test</h1>
    
    <div class="test-section">
        <h2>⚙️ Test Configuration</h2>
        <div class="config-row">
            <label>API Root:</label>
            <span class="info" id="apiRoot">Loading...</span>
        </div>
        <div class="config-row">
            <label>Test Date:</label>
            <input type="date" id="testDate" />
        </div>
        <div class="config-row">
            <label>Employee ID:</label>
            <input type="number" id="employeeId" value="1" style="width: 80px;" />
        </div>
        <div class="config-row">
            <label>Time Slot:</label>
            <input type="text" id="timeSlot" value="09:00" style="width: 80px;" placeholder="HH:MM" />
        </div>
    </div>

    <div class="test-section">
        <h2>🚀 Quick Tests</h2>
        <button onclick="testSelectSlot()">1️⃣ Select Slot</button>
        <button onclick="testPollSelections()">2️⃣ Poll Active Selections</button>
        <button onclick="testDeselectSlot()">3️⃣ Deselect Slot</button>
        <button onclick="testFullCycle()" style="background: #10b981;">▶️ Run Full Cycle</button>
        <button onclick="clearLog()" style="background: #6b7280;">🗑️ Clear Log</button>
    </div>

    <div class="test-section">
        <h2>📊 Test Results</h2>
        <div id="results">
            <span class="status pending">SELECT: ⏳ NOT RUN</span>
            <span class="status pending">POLL: ⏳ NOT RUN</span>
            <span class="status pending">DESELECT: ⏳ NOT RUN</span>
        </div>
    </div>

    <div class="test-section">
        <h2>📝 Live Log</h2>
        <div id="log"></div>
    </div>

    <script>
        // Auto-detect API root from current domain
        const currentDomain = window.location.origin;
        const apiRoot = currentDomain + '/wp-json/appointease/v1/';
        document.getElementById('apiRoot').textContent = apiRoot;

        let testResults = {
            select: null,
            poll: null,
            deselect: null
        };

        // Set test date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('testDate').value = tomorrow.toISOString().split('T')[0];

        function log(message, type = 'info') {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            const colors = { 
                info: '#3b82f6', 
                success: '#10b981', 
                error: '#ef4444', 
                warning: '#f59e0b' 
            };
            const icons = {
                info: 'ℹ️',
                success: '✅',
                error: '❌',
                warning: '⚠️'
            };
            logDiv.innerHTML += `<div style="color: ${colors[type]}; margin: 5px 0; padding: 5px; border-left: 3px solid ${colors[type]}; padding-left: 10px;">${icons[type]} [${timestamp}] ${message}</div>`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '';
            log('Log cleared', 'info');
        }

        function getTestParams() {
            const date = document.getElementById('testDate').value;
            const employeeId = document.getElementById('employeeId').value;
            const timeSlot = document.getElementById('timeSlot').value;
            return { date, employeeId, timeSlot };
        }

        async function testSelectSlot() {
            const { date, employeeId, timeSlot } = getTestParams();
            log(`Testing SELECT endpoint: ${timeSlot} on ${date} for employee ${employeeId}`, 'info');

            try {
                const response = await fetch(`${apiRoot}realtime/select`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: date,
                        time: timeSlot,
                        employee_id: parseInt(employeeId)
                    })
                });

                const data = await response.json();
                
                if (response.ok && data.success) {
                    log(`SELECT successful: ${data.message || 'Slot registered'}`, 'success');
                    testResults.select = true;
                    updateResults();
                    return true;
                } else {
                    log(`SELECT failed: ${data.message || 'Unknown error'}`, 'error');
                    testResults.select = false;
                    updateResults();
                    return false;
                }
            } catch (error) {
                log(`SELECT error: ${error.message}`, 'error');
                testResults.select = false;
                updateResults();
                return false;
            }
        }

        async function testPollSelections() {
            const { date, employeeId } = getTestParams();
            log(`Testing POLL endpoint: Checking active selections for ${date}, employee ${employeeId}`, 'info');

            try {
                const response = await fetch(`${apiRoot}realtime/poll?date=${date}&employee_id=${employeeId}`);
                const data = await response.json();

                if (response.ok) {
                    const count = data.active_selections ? data.active_selections.length : 0;
                    log(`POLL successful: ${count} active selection(s) found`, 'success');
                    if (count > 0) {
                        log(`Active slots: ${JSON.stringify(data.active_selections)}`, 'info');
                    }
                    testResults.poll = true;
                    updateResults();
                    return data.active_selections || [];
                } else {
                    log(`POLL failed: ${data.message || 'Unknown error'}`, 'error');
                    testResults.poll = false;
                    updateResults();
                    return null;
                }
            } catch (error) {
                log(`POLL error: ${error.message}`, 'error');
                testResults.poll = false;
                updateResults();
                return null;
            }
        }

        async function testDeselectSlot() {
            const { date, employeeId, timeSlot } = getTestParams();
            log(`Testing DESELECT endpoint: ${timeSlot} on ${date} for employee ${employeeId}`, 'info');

            try {
                const response = await fetch(`${apiRoot}realtime/deselect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: date,
                        time: timeSlot,
                        employee_id: parseInt(employeeId)
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    log(`DESELECT successful: ${data.message || 'Slot removed'}`, 'success');
                    testResults.deselect = true;
                    updateResults();
                    return true;
                } else {
                    log(`DESELECT failed: ${data.message || 'Unknown error'}`, 'error');
                    testResults.deselect = false;
                    updateResults();
                    return false;
                }
            } catch (error) {
                log(`DESELECT error: ${error.message}`, 'error');
                testResults.deselect = false;
                updateResults();
                return false;
            }
        }

        async function testFullCycle() {
            log('========== STARTING FULL CYCLE TEST ==========', 'warning');
            clearResults();

            // Step 1: Select slot
            log('Step 1/4: Selecting slot...', 'info');
            const selectSuccess = await testSelectSlot();
            await sleep(1000);

            // Step 2: Poll to verify selection
            log('Step 2/4: Polling to verify selection appears...', 'info');
            const selections = await testPollSelections();
            const pollSuccess = selections && selections.includes(document.getElementById('timeSlot').value);
            if (pollSuccess) {
                log('Verification: Slot appears in active selections ✓', 'success');
            } else {
                log('Verification: Slot NOT found in active selections ✗', 'error');
            }
            await sleep(1000);

            // Step 3: Deselect slot
            log('Step 3/4: Deselecting slot...', 'info');
            const deselectSuccess = await testDeselectSlot();
            await sleep(1000);

            // Step 4: Poll to verify cleanup
            log('Step 4/4: Polling to verify cleanup...', 'info');
            const finalSelections = await testPollSelections();
            const cleanupSuccess = finalSelections && !finalSelections.includes(document.getElementById('timeSlot').value);
            if (cleanupSuccess) {
                log('Verification: Slot removed from active selections ✓', 'success');
            } else {
                log('Verification: Slot still in active selections ✗', 'error');
            }

            // Final result
            log('========== FULL CYCLE TEST COMPLETE ==========', 'warning');
            if (selectSuccess && pollSuccess && deselectSuccess && cleanupSuccess) {
                log('🎉 ALL TESTS PASSED! System is working correctly.', 'success');
            } else {
                log('⚠️ Some tests failed. Check log above for details.', 'error');
            }
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function updateResults() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `
                <span class="status ${testResults.select === true ? 'pass' : testResults.select === false ? 'fail' : 'pending'}">
                    SELECT: ${testResults.select === true ? '✅ PASS' : testResults.select === false ? '❌ FAIL' : '⏳ NOT RUN'}
                </span>
                <span class="status ${testResults.poll === true ? 'pass' : testResults.poll === false ? 'fail' : 'pending'}">
                    POLL: ${testResults.poll === true ? '✅ PASS' : testResults.poll === false ? '❌ FAIL' : '⏳ NOT RUN'}
                </span>
                <span class="status ${testResults.deselect === true ? 'pass' : testResults.deselect === false ? 'fail' : 'pending'}">
                    DESELECT: ${testResults.deselect === true ? '✅ PASS' : testResults.deselect === false ? '❌ FAIL' : '⏳ NOT RUN'}
                </span>
            `;
        }

        function clearResults() {
            testResults = { select: null, poll: null, deselect: null };
            updateResults();
        }

        // Initialize
        updateResults();
        log('Test script loaded and ready! Click "Run Full Cycle" to start testing.', 'success');
        log(`API Root: ${apiRoot}`, 'info');
    </script>
</body>
</html>
