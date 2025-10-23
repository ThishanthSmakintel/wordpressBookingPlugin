const WebSocket = require('ws');
const http = require('http');
const mysql = require('mysql2/promise');

const PORT = 8080;
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wordpress'
};

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const email = url.searchParams.get('email');
    
    if (!email) {
        ws.close(1008, 'Email required');
        return;
    }
    
    clients.set(email, ws);
    console.log(`[WebSocket] Client connected: ${email}`);
    
    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: Date.now()
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`[WebSocket] Message from ${email}:`, data);
            
            if (data.type === 'subscribe') {
                const appointments = await getAppointments(email);
                ws.send(JSON.stringify({
                    type: 'update',
                    data: { appointments },
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
            console.error('[WebSocket] Message error:', error);
        }
    });
    
    ws.on('close', () => {
        clients.delete(email);
        console.log(`[WebSocket] Client disconnected: ${email}`);
    });
    
    ws.on('error', (error) => {
        console.error(`[WebSocket] Error for ${email}:`, error);
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

async function broadcastUpdate(email, data) {
    const client = clients.get(email);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
            type: 'update',
            data,
            timestamp: Date.now()
        }));
    }
}

setInterval(async () => {
    for (const [email, ws] of clients.entries()) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                const appointments = await getAppointments(email);
                ws.send(JSON.stringify({
                    type: 'update',
                    data: { appointments },
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error(`[WebSocket] Polling error for ${email}:`, error);
            }
        }
    }
}, 5000);

server.listen(PORT, () => {
    console.log(`[WebSocket] Server running on port ${PORT}`);
});
