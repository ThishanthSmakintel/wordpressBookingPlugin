/**
 * Mock Server for Testing Booking System
 * Simulates the WordPress REST API endpoints
 */

const http = require('http');
const url = require('url');

class MockBookingServer {
    constructor(port = 3001) {
        this.port = port;
        this.slots = new Map(); // Store locked slots
        this.appointments = new Map(); // Store appointments
        this.lockDuration = 30000; // 30 seconds
        this.rateLimits = new Map(); // IP rate limiting
    }

    start() {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(this.port, () => {
            console.log(`🚀 Mock server running on http://localhost:${this.port}`);
            console.log(`📡 Endpoints available:`);
            console.log(`   POST /wp-json/appointease/v1/lock-slot`);
            console.log(`   POST /wp-json/appointease/v1/unlock-slot`);
            console.log(`   POST /wp-json/appointease/v1/appointments`);
            console.log(`   POST /wp-json/appointease/v1/realtime/poll`);
        });

        return server;
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const method = req.method;

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Get request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = body ? JSON.parse(body) : {};
                this.routeRequest(path, method, data, req, res);
            } catch (error) {
                this.sendError(res, 400, 'Invalid JSON');
            }
        });
    }

    routeRequest(path, method, data, req, res) {
        const clientIP = req.connection.remoteAddress;

        // Clean expired locks
        this.cleanupExpiredLocks();

        switch (path) {
            case '/wp-json/appointease/v1/lock-slot':
                if (method === 'POST') {
                    this.handleLockSlot(data, clientIP, res);
                } else {
                    this.sendError(res, 405, 'Method not allowed');
                }
                break;

            case '/wp-json/appointease/v1/unlock-slot':
                if (method === 'POST') {
                    this.handleUnlockSlot(data, res);
                } else {
                    this.sendError(res, 405, 'Method not allowed');
                }
                break;

            case '/wp-json/appointease/v1/appointments':
                if (method === 'POST') {
                    this.handleCreateAppointment(data, res);
                } else {
                    this.sendError(res, 405, 'Method not allowed');
                }
                break;

            case '/wp-json/appointease/v1/realtime/poll':
                if (method === 'POST') {
                    this.handleRealtimePoll(data, res);
                } else {
                    this.sendError(res, 405, 'Method not allowed');
                }
                break;

            default:
                this.sendError(res, 404, 'Endpoint not found');
        }
    }

    handleLockSlot(data, clientIP, res) {
        const { date, time, employee_id, user_id } = data;
        const slotKey = `${date}_${time}_${employee_id}`;

        // Rate limiting check
        if (!this.checkRateLimit(clientIP)) {
            this.sendError(res, 429, 'Too many requests');
            return;
        }

        // Check if slot is already locked
        if (this.slots.has(slotKey)) {
            const lock = this.slots.get(slotKey);
            if (Date.now() < lock.expiresAt) {
                this.sendError(res, 409, 'Slot is currently locked', {
                    locked_by: lock.clientId,
                    expires_at: new Date(lock.expiresAt).toISOString()
                });
                return;
            }
        }

        // Create lock
        const clientId = this.generateClientId();
        const expiresAt = Date.now() + this.lockDuration;

        this.slots.set(slotKey, {
            clientId,
            date,
            time,
            employeeId: employee_id,
            userId: user_id,
            clientIP,
            expiresAt,
            createdAt: Date.now()
        });

        console.log(`🔒 Slot locked: ${slotKey} by ${clientId}`);

        this.sendSuccess(res, {
            success: true,
            client_id: clientId,
            expires_at: new Date(expiresAt).toISOString(),
            expires_in: this.lockDuration / 1000
        });
    }

    handleUnlockSlot(data, res) {
        const { client_id } = data;

        // Find and remove lock
        for (const [slotKey, lock] of this.slots.entries()) {
            if (lock.clientId === client_id) {
                this.slots.delete(slotKey);
                console.log(`🔓 Slot unlocked: ${slotKey} by ${client_id}`);
                this.sendSuccess(res, {
                    success: true,
                    message: 'Slot unlocked successfully'
                });
                return;
            }
        }

        this.sendError(res, 404, 'Lock not found or already released');
    }

    handleCreateAppointment(data, res) {
        const { name, email, phone, appointment_date, service_id, employee_id, client_id } = data;
        
        // Extract date and time from appointment_date
        const [date, timeWithSeconds] = appointment_date.split(' ');
        const time = timeWithSeconds.substring(0, 5); // Remove seconds
        const slotKey = `${date}_${time}_${employee_id}`;

        // Validate lock if client_id provided
        if (client_id) {
            const lock = this.slots.get(slotKey);
            if (!lock || lock.clientId !== client_id) {
                this.sendError(res, 409, 'Invalid or expired lock');
                return;
            }
            // Remove lock after successful booking
            this.slots.delete(slotKey);
        }

        // Check if slot is already booked
        if (this.appointments.has(slotKey)) {
            this.sendError(res, 409, 'Slot already booked');
            return;
        }

        // Create appointment
        const appointmentId = Math.floor(Math.random() * 100000);
        this.appointments.set(slotKey, {
            id: appointmentId,
            name,
            email,
            phone,
            appointment_date,
            service_id,
            employee_id,
            status: 'confirmed',
            created_at: new Date().toISOString()
        });

        console.log(`📅 Appointment created: ${appointmentId} for ${slotKey}`);

        this.sendSuccess(res, {
            success: true,
            appointment_id: appointmentId,
            message: 'Appointment booked successfully',
            confirmation_sent: true
        });
    }

    handleRealtimePoll(data, res) {
        const { date, employee_id, last_update } = data;

        // Simulate real-time updates
        const updates = [];
        const now = Date.now();

        // Add some mock updates if requested
        if (last_update && (now - last_update) > 1000) {
            updates.push({
                type: 'slot_status_change',
                date,
                employee_id,
                time: '10:00',
                status: 'available',
                timestamp: now
            });
        }

        this.sendSuccess(res, {
            updates,
            server_time: now,
            next_poll: 5000
        });
    }

    checkRateLimit(clientIP) {
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const maxRequests = 10;

        if (!this.rateLimits.has(clientIP)) {
            this.rateLimits.set(clientIP, []);
        }

        const requests = this.rateLimits.get(clientIP);
        
        // Remove old requests
        const recentRequests = requests.filter(time => (now - time) < windowMs);
        
        if (recentRequests.length >= maxRequests) {
            return false;
        }

        recentRequests.push(now);
        this.rateLimits.set(clientIP, recentRequests);
        return true;
    }

    cleanupExpiredLocks() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [slotKey, lock] of this.slots.entries()) {
            if (now >= lock.expiresAt) {
                this.slots.delete(slotKey);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} expired locks`);
        }
    }

    generateClientId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    sendSuccess(res, data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    sendError(res, status, message, data = {}) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message,
            ...data
        }));
    }

    getStats() {
        return {
            active_locks: this.slots.size,
            total_appointments: this.appointments.size,
            rate_limit_ips: this.rateLimits.size
        };
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new MockBookingServer();
    const httpServer = server.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down mock server...');
        httpServer.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });

    // Show stats every 30 seconds
    setInterval(() => {
        const stats = server.getStats();
        console.log(`📊 Stats: ${stats.active_locks} locks, ${stats.total_appointments} appointments`);
    }, 30000);
}

module.exports = MockBookingServer;