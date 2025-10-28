/**
 * Booking System Stress Test
 * Tests multi-user concurrent booking scenarios to validate conflict prevention
 */

class BookingStressTest {
    constructor(baseUrl = 'http://localhost:3001/wp-json/appointease/v1') {
        this.baseUrl = baseUrl;
        this.results = [];
        this.activeUsers = [];
    }

    // Simulate a single user booking flow
    async simulateUser(userId, targetSlot) {
        const user = {
            id: userId,
            email: `user${userId}@test.com`,
            targetSlot,
            startTime: Date.now(),
            events: []
        };

        try {
            // Step 1: Lock slot
            const lockResponse = await fetch(`${this.baseUrl}/lock-slot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '2025-01-20',
                    time: targetSlot,
                    employee_id: 1,
                    user_id: userId
                })
            });

            const lockData = await lockResponse.json();
            user.events.push({ type: 'lock_attempt', success: lockData.success, time: Date.now() });

            if (!lockData.success) {
                user.events.push({ type: 'lock_failed', reason: lockData.message, time: Date.now() });
                return user;
            }

            // Step 2: Simulate user thinking time (1-3 seconds)
            const thinkTime = Math.random() * 2000 + 1000;
            await new Promise(resolve => setTimeout(resolve, thinkTime));

            // Step 3: Attempt booking
            const bookingResponse = await fetch(`${this.baseUrl}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Test User ${userId}`,
                    email: user.email,
                    phone: `555-000${userId}`,
                    appointment_date: `2025-01-20 ${targetSlot}:00`,
                    service_id: 1,
                    employee_id: 1,
                    client_id: lockData.client_id
                })
            });

            const bookingData = await bookingResponse.json();
            user.events.push({ 
                type: 'booking_attempt', 
                success: bookingData.success, 
                appointmentId: bookingData.appointment_id,
                time: Date.now() 
            });

            // Step 4: Unlock slot (cleanup)
            if (lockData.client_id) {
                await fetch(`${this.baseUrl}/unlock-slot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ client_id: lockData.client_id })
                });
            }

        } catch (error) {
            user.events.push({ type: 'error', message: error.message, time: Date.now() });
        }

        user.endTime = Date.now();
        user.duration = user.endTime - user.startTime;
        return user;
    }

    // Test 1: Race condition - multiple users same slot
    async testRaceCondition() {
        console.log('🏁 Testing Race Condition: 5 users, same slot');
        
        const promises = [];
        for (let i = 1; i <= 5; i++) {
            promises.push(this.simulateUser(i, '10:00'));
        }

        const results = await Promise.all(promises);
        
        // Analysis
        const successful = results.filter(u => 
            u.events.some(e => e.type === 'booking_attempt' && e.success)
        );
        const locked = results.filter(u => 
            u.events.some(e => e.type === 'lock_attempt' && e.success)
        );

        console.log(`✅ Locks acquired: ${locked.length}/5`);
        console.log(`✅ Successful bookings: ${successful.length}/5`);
        console.log(`✅ Expected: Only 1 booking should succeed`);
        
        return {
            test: 'race_condition',
            totalUsers: 5,
            locksAcquired: locked.length,
            successfulBookings: successful.length,
            passed: successful.length === 1,
            results
        };
    }

    // Test 2: Load test - different slots
    async testLoadHandling() {
        console.log('⚡ Testing Load: 10 users, different slots');
        
        const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];
        const promises = [];
        
        for (let i = 1; i <= 10; i++) {
            const slot = timeSlots[i - 1];
            promises.push(this.simulateUser(i, slot));
        }

        const results = await Promise.all(promises);
        
        const successful = results.filter(u => 
            u.events.some(e => e.type === 'booking_attempt' && e.success)
        );

        console.log(`✅ Successful bookings: ${successful.length}/10`);
        console.log(`✅ Expected: All 10 should succeed (different slots)`);
        
        return {
            test: 'load_handling',
            totalUsers: 10,
            successfulBookings: successful.length,
            passed: successful.length === 10,
            results
        };
    }

    // Test 3: Abandonment - users lock but don't book
    async testAbandonmentCleanup() {
        console.log('🚪 Testing Abandonment: Lock without booking');
        
        const user = {
            id: 999,
            email: 'abandoner@test.com',
            events: []
        };

        // Lock slot but don't book
        const lockResponse = await fetch(`${this.baseUrl}/lock-slot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: '2025-01-20',
                time: '14:00',
                employee_id: 1,
                user_id: 999
            })
        });

        const lockData = await lockResponse.json();
        user.events.push({ type: 'lock_acquired', clientId: lockData.client_id });

        // Wait for server-side expiration (should be ~30 seconds)
        console.log('⏳ Waiting for lock expiration...');
        await new Promise(resolve => setTimeout(resolve, 35000));

        // Try to book the same slot with different user
        const newUserResponse = await fetch(`${this.baseUrl}/lock-slot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: '2025-01-20',
                time: '14:00',
                employee_id: 1,
                user_id: 1000
            })
        });

        const newLockData = await newUserResponse.json();
        
        console.log(`✅ Lock expired and released: ${newLockData.success}`);
        console.log(`✅ Expected: New user should be able to lock`);

        return {
            test: 'abandonment_cleanup',
            lockExpired: newLockData.success,
            passed: newLockData.success === true
        };
    }

    // Test 4: WebSocket real-time updates
    async testRealtimeUpdates() {
        console.log('🔄 Testing Real-time Updates');
        
        // This would require WebSocket connection simulation
        // For now, we'll test the HTTP polling fallback
        
        const response = await fetch(`${this.baseUrl}/realtime/poll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: '2025-01-20',
                employee_id: 1,
                last_update: Date.now() - 5000
            })
        });

        const data = await response.json();
        
        return {
            test: 'realtime_updates',
            pollingWorks: response.ok,
            hasUpdates: Array.isArray(data.updates),
            passed: response.ok
        };
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Booking System Stress Tests\n');
        
        const testResults = [];
        
        try {
            testResults.push(await this.testRaceCondition());
            console.log('');
            
            testResults.push(await this.testLoadHandling());
            console.log('');
            
            testResults.push(await this.testRealtimeUpdates());
            console.log('');
            
            // Skip abandonment test in quick mode (takes 35 seconds)
            if (process.argv.includes('--full')) {
                testResults.push(await this.testAbandonmentCleanup());
            }
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }

        // Summary
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.test}`);
        });

        const passedTests = testResults.filter(r => r.passed).length;
        console.log(`\n🎯 Overall: ${passedTests}/${testResults.length} tests passed`);
        
        return testResults;
    }
}

// CLI Usage
if (typeof window === 'undefined') {
    // Node.js environment
    const test = new BookingStressTest();
    test.runAllTests().then(results => {
        process.exit(results.every(r => r.passed) ? 0 : 1);
    });
} else {
    // Browser environment
    window.BookingStressTest = BookingStressTest;
}

// Export for module usage
if (typeof module !== 'undefined') {
    module.exports = BookingStressTest;
}