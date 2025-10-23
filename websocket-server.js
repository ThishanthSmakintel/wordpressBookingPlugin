const WebSocket = require('ws');
const http = require('http');
const mysql = require('mysql2/promise');

const PORT = 8080;
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'blog_promoplus_com'  // Updated to match your WordPress database
};

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const email = url.searchParams.get('email');
    const clientId = email || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    clients.set(clientId, { ws, email, isAnonymous: !email });
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
    
    ws.on('close', () => {
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
    console.log(`\n🌐 WordPress Site: http://blog.promoplus.com/`);
    console.log(`\n✅ Ready for connections!\n`);
});
