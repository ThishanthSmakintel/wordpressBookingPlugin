const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'blog_promoplus'
};

async function testLock() {
    //console.log('=== WebSocket Lock Test ===\n');
    
    const connection = await mysql.createConnection(DB_CONFIG);
    
    try {
        // Test data
        const date = '2025-10-27';
        const time = '09:15';
        const employeeId = 2;
        const clientId = 'test_websocket_client';
        
        //console.log('Test Parameters:');
        //console.log(`  Date: ${date}`);
        //console.log(`  Time: ${time}`);
        //console.log(`  Employee ID: ${employeeId}`);
        //console.log(`  Client ID: ${clientId}\n`);
        
        // Attempt insert (same as WebSocket server)
        //console.log('Attempting INSERT...');
        const [result] = await connection.execute(
            'INSERT INTO wp_appointease_slot_locks (date, time, employee_id, client_id, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE)) ON DUPLICATE KEY UPDATE client_id = ?, expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)',
            [date, time, employeeId, clientId, clientId]
        );
        
        //console.log('✅ INSERT successful!');
        //console.log(`  Affected Rows: ${result.affectedRows}`);
        //console.log(`  Insert ID: ${result.insertId}\n`);
        
        // Verify in database
        //console.log('Verifying in database...');
        const [rows] = await connection.execute(
            'SELECT *, TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining FROM wp_appointease_slot_locks WHERE client_id = ?',
            [clientId]
        );
        
        if (rows.length > 0) {
            //console.log('✅ Lock found in database:');
            rows.forEach(row => {
                //console.log(`  ID: ${row.id}`);
                //console.log(`  Date: ${row.date}`);
                //console.log(`  Time: ${row.time}`);
                //console.log(`  Employee: ${row.employee_id}`);
                //console.log(`  Expires: ${row.expires_at}`);
                //console.log(`  Remaining: ${row.remaining}s\n`);
            });
        } else {
            //console.log('❌ Lock NOT found in database!\n');
        }
        
        // Cleanup
        //console.log('Cleaning up test data...');
        await connection.execute(
            'DELETE FROM wp_appointease_slot_locks WHERE client_id = ?',
            [clientId]
        );
        //console.log('✅ Test data cleaned up\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await connection.end();
    }
}

testLock();
