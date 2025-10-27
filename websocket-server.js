const WebSocket = require('ws');
const http = require('http');
const mysql = require('mysql2/promise');

const PORT = 8080;
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'blog_promoplus'
};

const clients = new Map();
const activeSelections = new Map();
const lockedSlots = new Map(); // Industry standard: Lock slots during booking (10 min)

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/debug') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const debugInfo = {
            connectedClients: clients.size,
            activeSelections: activeSelections.size,
            clients: Array.from(clients.entries()).map(([id, client]) => ({
                id,
                email: client.email || 'Anonymous',
                isAnonymous: client.isAnonymous,
                watchingSlot: client.watchingSlot
            })),
            selections: Array.from(activeSelections.entries()).map(([key, data]) => {
                const [date, time, employeeId] = key.split('_');
                return {
                    date,
                    time,
                    employeeId,
                    clientId: data.clientId,
                    age: Math.round((Date.now() - data.timestamp) / 1000) + 's'
                };
            }),
            timestamp: new Date().toISOString()
        };
        res.end(JSON.stringify(debugInfo, null, 2));
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
});
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const email = url.searchParams.get('email');
    const clientId = email || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    clients.set(clientId, { ws, email, isAnonymous: !email, watchingSlot: null });
    console.log(`[WebSocket] Client connected: ${email || 'Anonymous'} (ID: ${clientId})`);
    
    ws.send(JSON.stringify({
        type: 'connection',
        mode: 'websocket',
        status: 'connected',
        clientId: clientId,
        isAnonymous: !email,
        timestamp: Date.now()
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`[WebSocket] Message from ${email || 'Anonymous'}:`, data);
            
            if (data.type === 'subscribe' && email) {
                const appointments = await getAppointments(email);
                ws.send(JSON.stringify({
                    type: 'update',
                    data: { appointments },
                    timestamp: Date.now()
                }));
            } else if (data.type === 'lock_slot') {
                // Lock slot in database (Calendly standard: 10 min)
                const expiresAt = new Date(Date.now() + 600000);
                await lockSlotInDB(data.date, data.time, data.employeeId, clientId, expiresAt);
                console.log(`[WebSocket] Slot locked in DB: ${data.date} ${data.time} for 10 minutes`);
                const client = clients.get(clientId);
                if (client) client.step = 6;
                broadcastAvailabilityUpdate(data.date, data.employeeId);
            } else if (data.type === 'unlock_slot') {
                // Unlock slot from database
                await unlockSlotInDB(data.date, data.time, data.employeeId);
                console.log(`[WebSocket] Slot unlocked from DB: ${data.date} ${data.time}`);
                const client = clients.get(clientId);
                if (client) client.step = data.completed ? 7 : 4;
                broadcastAvailabilityUpdate(data.date, data.employeeId);
            } else if (data.type === 'selecting_slot') {
                // User is actively selecting a slot
                const slotKey = `${data.date}_${data.time}_${data.employeeId}`;
                activeSelections.set(slotKey, { clientId, timestamp: Date.now() });
                console.log(`[WebSocket] User selecting slot: ${data.date} ${data.time} (Staff #${data.employeeId})`);
                broadcastActiveSelections(data.date, data.employeeId, clientId);
            } else if (data.type === 'deselect_slot') {
                // User deselected or moved away
                const slotKey = `${data.date}_${data.time}_${data.employeeId}`;
                activeSelections.delete(slotKey);
                broadcastActiveSelections(data.date, data.employeeId, clientId);
            } else if (data.type === 'watch_slot' && data.date && data.time && data.employeeId) {
                // Watch specific time slot for conflicts (Calendly-style)
                console.log(`[WebSocket] Watching slot: ${data.date} ${data.time} for employee ${data.employeeId}`);
                const client = clients.get(clientId);
                if (client) {
                    client.watchingSlot = {
                        date: data.date,
                        time: data.time,
                        employeeId: data.employeeId
                    };
                }
            } else if (data.type === 'get_debug') {
                // Send debug info via WebSocket
                const now = Date.now();
                ws.send(JSON.stringify({
                    type: 'debug_info',
                    connectedClients: clients.size,
                    activeSelections: activeSelections.size,
                    lockedSlots: lockedSlots.size,
                    clients: Array.from(clients.entries()).map(([id, client]) => ({
                        email: client.email || 'Anonymous',
                        watchingSlot: client.watchingSlot,
                        step: client.step || 'unknown'
                    })),
                    selections: Array.from(activeSelections.entries()).map(([key, data]) => {
                        const [date, time, employeeId] = key.split('_');
                        return { date, time, employeeId, age: Math.round((now - data.timestamp) / 1000) + 's' };
                    }),
                    locks: await getActiveLocks(),
                    timestamp: now
                }));
            } else if (data.type === 'check_availability') {
                // Real-time availability check from database
                const unavailable = await getUnavailableSlots(data.date, data.employeeId);
                ws.send(JSON.stringify({
                    type: 'availability_update',
                    date: data.date,
                    employeeId: data.employeeId,
                    unavailable: unavailable,
                    timestamp: Date.now()
                }));
            } else if (data.type === 'ping') {
                ws.send(JSON.stringify({
                    type: 'pong',
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
            console.error('[WebSocket] Message error:', error);
        }
    });
    
    ws.on('close', async () => {
        // Clean up active selections
        for (const [slotKey, selection] of activeSelections.entries()) {
            if (selection.clientId === clientId) {
                activeSelections.delete(slotKey);
            }
        }
        // Clean up locks for this client
        const connection = await mysql.createConnection(DB_CONFIG);
        try {
            await connection.execute(
                'DELETE FROM wp_appointease_slot_locks WHERE client_id = ?',
                [clientId]
            );
        } finally {
            await connection.end();
        }
        clients.delete(clientId);
        console.log(`[WebSocket] Client disconnected: ${email || 'Anonymous'} (ID: ${clientId})`);
    });
    
    ws.on('error', (error) => {
        console.error(`[WebSocket] Error for ${email || 'Anonymous'}:`, error);
    });
});

async function getAppointments(email) {
    const connection = await mysql.createConnection(DB_CONFIG);
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM wp_appointments WHERE email = ? ORDER BY appointment_date DESC',
            [email]
        );
        return rows;
    } finally {
        await connection.end();
    }
}

async function lockSlotInDB(date, time, employeeId, clientId, expiresAt) {
    const connection = await mysql.createConnection(DB_CONFIG);
    try {
        await connection.execute(
            'INSERT INTO wp_appointease_slot_locks (date, time, employee_id, client_id, expires_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE client_id = ?, expires_at = ?',
            [date, time, employeeId, clientId, expiresAt, clientId, expiresAt]
        );
        lockedSlots.set(`${date}_${time}_${employeeId}`, { clientId, expiresAt: expiresAt.getTime() });
    } finally {
        await connection.end();
    }
}

async function unlockSlotInDB(date, time, employeeId) {
    const connection = await mysql.createConnection(DB_CONFIG);
    try {
        await connection.execute(
            'DELETE FROM wp_appointease_slot_locks WHERE date = ? AND time = ? AND employee_id = ?',
            [date, time, employeeId]
        );
        lockedSlots.delete(`${date}_${time}_${employeeId}`);
    } finally {
        await connection.end();
    }
}

async function getUnavailableSlots(date, employeeId) {
    const connection = await mysql.createConnection(DB_CONFIG);
    try {
        const [rows] = await connection.execute(
            "SELECT TIME_FORMAT(appointment_date, '%H:%i') as time FROM wp_appointease_appointments WHERE DATE(appointment_date) = ? AND employee_id = ? AND status != 'cancelled'",
            [date, employeeId]
        );
        const bookedSlots = rows.map(row => row.time);
        
        // Get locked slots from database
        const [lockRows] = await connection.execute(
            "SELECT time FROM wp_appointease_slot_locks WHERE date = ? AND employee_id = ? AND expires_at > NOW()",
            [date, employeeId]
        );
        const lockedSlots = lockRows.map(row => row.time);
        
        // Clean expired locks
        await connection.execute(
            'DELETE FROM wp_appointease_slot_locks WHERE expires_at <= NOW()'
        );
        
        return [...new Set([...bookedSlots, ...lockedSlots])];
    } finally {
        await connection.end();
    }
}

async function broadcastUpdate(email, data) {
    for (const [clientId, client] of clients.entries()) {
        if (client.email === email && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type: 'update',
                data,
                timestamp: Date.now()
            }));
        }
    }
}

// Broadcast slot conflicts to watching clients (Calendly-style real-time conflicts)
async function broadcastSlotConflict(date, time, employeeId) {
    const conflictSlot = `${date} ${time}`;
    console.log(`[WebSocket] Broadcasting slot conflict: ${conflictSlot} for employee ${employeeId}`);
    
    for (const [clientId, client] of clients.entries()) {
        if (client.ws.readyState === WebSocket.OPEN && client.watchingSlot) {
            const watching = client.watchingSlot;
            if (watching.date === date && watching.time === time && watching.employeeId === employeeId) {
                client.ws.send(JSON.stringify({
                    type: 'slot_taken',
                    slot: conflictSlot,
                    date: date,
                    time: time,
                    employeeId: employeeId,
                    timestamp: Date.now()
                }));
            }
        }
    }
}

// Broadcast active selections to all clients viewing same date
function broadcastActiveSelections(date, employeeId, excludeClientId) {
    const activeSlots = [];
    const now = Date.now();
    
    // Clean up stale selections (older than 30 seconds)
    for (const [slotKey, selection] of activeSelections.entries()) {
        if (now - selection.timestamp > 30000) {
            activeSelections.delete(slotKey);
        } else if (slotKey.startsWith(`${date}_`) && slotKey.endsWith(`_${employeeId}`)) {
            const time = slotKey.split('_')[1];
            activeSlots.push(time);
        }
    }
    
    // Broadcast to all clients
    for (const [clientId, client] of clients.entries()) {
        if (client.ws.readyState === WebSocket.OPEN && clientId !== excludeClientId) {
            client.ws.send(JSON.stringify({
                type: 'active_selections',
                date: date,
                employeeId: employeeId,
                slots: activeSlots,
                timestamp: now
            }));
        }
    }
}

// Broadcast availability updates to all watching clients
async function broadcastAvailabilityUpdate(date, employeeId) {
    const unavailable = await getUnavailableSlots(date, employeeId);
    
    for (const [clientId, client] of clients.entries()) {
        if (client.ws.readyState === WebSocket.OPEN && client.watchingSlot) {
            if (client.watchingSlot.date === date && client.watchingSlot.employeeId === employeeId) {
                client.ws.send(JSON.stringify({
                    type: 'availability_update',
                    date: date,
                    employeeId: employeeId,
                    unavailable: unavailable,
                    timestamp: Date.now()
                }));
            }
        }
    }
}

async function getActiveLocks() {
    const connection = await mysql.createConnection(DB_CONFIG);
    try {
        const [rows] = await connection.execute(
            'SELECT date, time, employee_id, client_id, TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining FROM wp_appointease_slot_locks WHERE expires_at > NOW()'
        );
        return rows.map(row => ({
            date: row.date,
            time: row.time,
            employeeId: row.employee_id,
            clientId: row.client_id,
            remaining: row.remaining + 's',
            expired: false
        }));
    } finally {
        await connection.end();
    }
}

// Export for external use (when appointments are created via API)
global.broadcastSlotConflict = broadcastSlotConflict;
global.broadcastAvailabilityUpdate = broadcastAvailabilityUpdate;

// Polling interval for real-time updates
setInterval(async () => {
    for (const [clientId, client] of clients.entries()) {
        if (client.ws.readyState === WebSocket.OPEN && client.email) {
            try {
                const appointments = await getAppointments(client.email);
                client.ws.send(JSON.stringify({
                    type: 'update',
                    data: { appointments },
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error(`[WebSocket] Polling error for ${client.email}:`, error);
            }
        }
    }
}, 5000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[WebSocket] Server running on port ${PORT}`);
    console.log(`\n🔗 WebSocket URLs:`);
    console.log(`   Local:     ws://localhost:${PORT}`);
    console.log(`   Domain:    ws://blog.promoplus.com:${PORT}`);
    console.log(`   Example:   ws://blog.promoplus.com:${PORT}?email=user@example.com`);
    console.log(`\n🔍 Debug Panel:`);
    console.log(`   HTTP:      http://localhost:${PORT}/debug`);
    console.log(`   Info:      Real-time connections & active selections`);
    console.log(`\n🌐 WordPress Site: http://blog.promoplus.com/`);
    console.log(`\n✅ Ready for connections!\n`);
});
