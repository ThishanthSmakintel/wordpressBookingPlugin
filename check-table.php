<?php
$conn = new mysqli('localhost', 'root', '', 'blog_promoplus');
if ($conn->connect_error) die("Connection failed");

echo "=== TABLE CHECK ===\n\n";

// Check if table exists
$result = $conn->query("SHOW TABLES LIKE 'wp_appointease_slot_locks'");
echo "Table exists: " . ($result->num_rows > 0 ? "YES" : "NO") . "\n\n";

if ($result->num_rows > 0) {
    // Show table structure
    echo "=== TABLE STRUCTURE ===\n";
    $structure = $conn->query("DESCRIBE wp_appointease_slot_locks");
    while($row = $structure->fetch_assoc()) {
        echo $row['Field'] . " (" . $row['Type'] . ") " . ($row['Null'] == 'NO' ? 'NOT NULL' : 'NULL') . "\n";
    }
    
    // Test insert
    echo "\n=== TEST INSERT ===\n";
    $test_sql = "INSERT INTO wp_appointease_slot_locks (date, time, employee_id, client_id, expires_at) 
                 VALUES ('2025-10-27', '09:15', 2, 'test_client', DATE_ADD(NOW(), INTERVAL 10 MINUTE))";
    
    if ($conn->query($test_sql)) {
        echo "✅ Insert successful! ID: " . $conn->insert_id . "\n";
        
        // Verify
        $verify = $conn->query("SELECT * FROM wp_appointease_slot_locks WHERE client_id = 'test_client'");
        if ($verify->num_rows > 0) {
            $row = $verify->fetch_assoc();
            echo "✅ Verified in DB:\n";
            echo "  Date: " . $row['date'] . "\n";
            echo "  Time: " . $row['time'] . "\n";
            echo "  Expires: " . $row['expires_at'] . "\n";
            
            // Cleanup
            $conn->query("DELETE FROM wp_appointease_slot_locks WHERE client_id = 'test_client'");
            echo "✅ Test record cleaned up\n";
        }
    } else {
        echo "❌ Insert failed: " . $conn->error . "\n";
    }
}

$conn->close();
?>
