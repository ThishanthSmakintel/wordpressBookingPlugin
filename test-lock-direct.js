// Direct test bypassing WebSocket server
const mysql = require('mysql2/promise');

async function testDirectLock() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'blog_promoplus'
    });
    
    const date = '2025-10-27';
    const time = '09:30';
    const employeeId = 2;
    const clientId = 'direct_test';
    
    console.log('[Direct Test] Inserting lock...');
    console.log(`  date=${date}, time=${time}, employee=${employeeId}, client=${clientId}`);
    
    try {
        const [result] = await pool.execute(
            'INSERT INTO wp_appointease_slot_locks (date, time, employee_id, client_id, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE)) ON DUPLICATE KEY UPDATE client_id = ?, expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)',
            [date, time, employeeId, clientId, clientId]
        );
        
        console.log('✅ INSERT successful!');
        console.log(`  Affected rows: ${result.affectedRows}`);
        console.log(`  Insert ID: ${result.insertId}`);
        
        // Verify
        const [rows] = await pool.execute(
            'SELECT *, TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining FROM wp_appointease_slot_locks WHERE client_id = ?',
            [clientId]
        );
        
        if (rows.length > 0) {
            console.log('\n✅ Verified in database:');
            console.log(`  ID: ${rows[0].id}`);
            console.log(`  Remaining: ${rows[0].remaining}s`);
        }
        
        // Cleanup
        await pool.execute('DELETE FROM wp_appointease_slot_locks WHERE client_id = ?', [clientId]);
        console.log('\n✅ Cleaned up');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testDirectLock();
