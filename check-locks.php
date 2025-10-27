<?php
/**
 * Quick Database Lock Checker
 * Run: php check-locks.php
 */

// WordPress database connection
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'blog_promoplus';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "=== ACTIVE SLOT LOCKS ===\n\n";

// Check active locks
$sql = "SELECT 
    id,
    date,
    time,
    employee_id,
    client_id,
    created_at,
    expires_at,
    TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining_seconds,
    NOW() as server_time
FROM wp_appointease_slot_locks 
WHERE expires_at > NOW()
ORDER BY created_at DESC";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo "Found " . $result->num_rows . " active lock(s):\n\n";
    while($row = $result->fetch_assoc()) {
        echo "Lock ID: " . $row['id'] . "\n";
        echo "  Date: " . $row['date'] . "\n";
        echo "  Time: " . $row['time'] . "\n";
        echo "  Employee: #" . $row['employee_id'] . "\n";
        echo "  Client: " . $row['client_id'] . "\n";
        echo "  Created: " . $row['created_at'] . "\n";
        echo "  Expires: " . $row['expires_at'] . "\n";
        echo "  Remaining: " . $row['remaining_seconds'] . " seconds\n";
        echo "  Server Time: " . $row['server_time'] . "\n";
        echo "  ---\n";
    }
} else {
    echo "No active locks found.\n";
}

echo "\n=== EXPIRED LOCKS ===\n\n";

// Check expired locks
$sql_expired = "SELECT 
    id,
    date,
    time,
    employee_id,
    client_id,
    created_at,
    expires_at,
    TIMESTAMPDIFF(SECOND, expires_at, NOW()) as expired_seconds_ago
FROM wp_appointease_slot_locks 
WHERE expires_at <= NOW()
ORDER BY expires_at DESC
LIMIT 10";

$result_expired = $conn->query($sql_expired);

if ($result_expired->num_rows > 0) {
    echo "Found " . $result_expired->num_rows . " expired lock(s):\n\n";
    while($row = $result_expired->fetch_assoc()) {
        echo "Lock ID: " . $row['id'] . "\n";
        echo "  Date: " . $row['date'] . "\n";
        echo "  Time: " . $row['time'] . "\n";
        echo "  Expired: " . $row['expired_seconds_ago'] . " seconds ago\n";
        echo "  ---\n";
    }
} else {
    echo "No expired locks found.\n";
}

echo "\n=== ALL LOCKS (Last 20) ===\n\n";

// Check all locks
$sql_all = "SELECT 
    id,
    date,
    time,
    employee_id,
    client_id,
    created_at,
    expires_at,
    CASE 
        WHEN expires_at > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as status
FROM wp_appointease_slot_locks 
ORDER BY created_at DESC
LIMIT 20";

$result_all = $conn->query($sql_all);

if ($result_all->num_rows > 0) {
    echo "Total locks in table: " . $result_all->num_rows . "\n\n";
    while($row = $result_all->fetch_assoc()) {
        echo "[" . $row['status'] . "] " . $row['date'] . " " . $row['time'] . " (Employee #" . $row['employee_id'] . ")\n";
        echo "  Client: " . $row['client_id'] . "\n";
        echo "  Created: " . $row['created_at'] . " | Expires: " . $row['expires_at'] . "\n";
        echo "  ---\n";
    }
} else {
    echo "No locks found in table.\n";
}

$conn->close();
?>
