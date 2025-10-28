const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'blog_promoplus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

async function diagnose() {
    //console.log('=== LOCK ISSUE DIAGNOSIS ===\n');
    
    let pool;
    try {
        // Test 1: Create pool
        //console.log('Test 1: Creating connection pool...');
        pool = mysql.createPool(DB_CONFIG);
        //console.log('✅ Pool created\n');
        
        // Test 2: Test connection
        //console.log('Test 2: Testing connection...');
        const connection = await pool.getConnection();
        //console.log('✅ Connection successful');
        connection.release();
        //console.log('✅ Connection released\n');
        
        // Test 3: Check table exists
        //console.log('Test 3: Checking table exists...');
        const [tables] = await pool.execute("SHOW TABLES LIKE 'wp_appointease_slot_locks'");
        if (tables.length > 0) {
            //console.log('✅ Table exists\n');
        } else {
            //console.log('❌ Table does NOT exist!\n');
            return;
        }
        
        // Test 4: Exact WebSocket server query
        //console.log('Test 4: Running EXACT WebSocket server INSERT query...');
        const date = '2025-10-27';
        const time = '09:30';
        const employeeId = 2;
        const clientId = 'diagnose_test_client';
        
        //console.log('Parameters:');
        //console.log(`  date: ${date} (type: ${typeof date})`);
        //console.log(`  time: ${time} (type: ${typeof time})`);
        //console.log(`  employeeId: ${employeeId} (type: ${typeof employeeId})`);
        //console.log(`  clientId: ${clientId} (type: ${typeof clientId})`);
        //console.log('');
        
        try {
            const [result] = await pool.execute(
                'INSERT INTO wp_appointease_slot_locks (date, time, employee_id, client_id, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE)) ON DUPLICATE KEY UPDATE client_id = ?, expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)',
                [date, time, employeeId, clientId, clientId]
            );
            
            //console.log('✅ INSERT successful!');
            //console.log(`  Affected Rows: ${result.affectedRows}`);
            //console.log(`  Insert ID: ${result.insertId}`);
            //console.log(`  Warning Count: ${result.warningCount}\n`);
            
            // Test 5: Verify in database
            //console.log('Test 5: Verifying in database...');
            const [rows] = await pool.execute(
                'SELECT *, TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining FROM wp_appointease_slot_locks WHERE client_id = ?',
                [clientId]
            );
            
            if (rows.length > 0) {
                //console.log('✅ Lock verified in database:');
                //console.log(`  ID: ${rows[0].id}`);
                //console.log(`  Date: ${rows[0].date}`);
                //console.log(`  Time: ${rows[0].time}`);
                //console.log(`  Employee: ${rows[0].employee_id}`);
                //console.log(`  Expires: ${rows[0].expires_at}`);
                //console.log(`  Remaining: ${rows[0].remaining}s\n`);
                
                // Cleanup
                await pool.execute('DELETE FROM wp_appointease_slot_locks WHERE client_id = ?', [clientId]);
                //console.log('✅ Test data cleaned up\n');
            } else {
                //console.log('❌ Lock NOT found in database after insert!\n');
            }
            
        } catch (insertError) {
            //console.log('❌ INSERT FAILED!');
            //console.log('Error Code:', insertError.code);
            //console.log('Error Number:', insertError.errno);
            //console.log('SQL State:', insertError.sqlState);
            //console.log('SQL Message:', insertError.sqlMessage);
            //console.log('Full Error:', insertError);
            //console.log('');
        }
        
        // Test 6: Check for existing locks
        //console.log('Test 6: Checking for any existing locks...');
        const [allLocks] = await pool.execute(
            'SELECT COUNT(*) as count FROM wp_appointease_slot_locks'
        );
        //console.log(`Total locks in table: ${allLocks[0].count}\n`);
        
        //console.log('=== DIAGNOSIS COMPLETE ===\n');
        //console.log('Summary:');
        //console.log('- If INSERT succeeded here but fails in WebSocket server,');
        //console.log('  the issue is in the WebSocket server code or configuration.');
        //console.log('- Check the WebSocket server console for the actual error.');
        //console.log('- The error should now be visible with detailed logging.\n');
        
    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (pool) {
            await pool.end();
            //console.log('Connection pool closed');
        }
    }
}

diagnose();
