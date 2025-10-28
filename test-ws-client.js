const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    //console.log('✅ Connected to WebSocket server');
    
    // Send lock_slot message
    const lockMessage = {
        type: 'lock_slot',
        date: '2025-10-27',
        time: '09:30',
        employeeId: 2,
        service: 'Test Service'
    };
    
    //console.log('\n📤 Sending lock_slot message:', lockMessage);
    ws.send(JSON.stringify(lockMessage));
    
    // Wait for response
    setTimeout(() => {
        //console.log('\n⏱️  Waiting 2 seconds for database insert...');
    }, 1000);
    
    setTimeout(() => {
        ws.close();
        //console.log('\n🔌 Connection closed');
        //console.log('\n👉 Now run: php check-locks.php');
        process.exit(0);
    }, 3000);
});

ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    //console.log('📥 Received:', message);
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    process.exit(1);
});
