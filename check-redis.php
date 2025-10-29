<?php
/**
 * Redis Status Check
 * Run: php check-redis.php
 */

echo "🔍 Checking Redis Status...\n\n";

// Check if Redis extension is installed
if (!class_exists('Redis')) {
    echo "❌ Redis PHP extension NOT installed\n";
    echo "💡 Install: pecl install redis\n";
    echo "   Or download from: https://pecl.php.net/package/redis\n\n";
    exit(1);
}

echo "✅ Redis PHP extension installed\n\n";

// Try to connect
try {
    $redis = new Redis();
    $connected = @$redis->connect('127.0.0.1', 6379, 2);
    
    if (!$connected) {
        echo "❌ Redis NOT running on 127.0.0.1:6379\n";
        echo "💡 Start Redis:\n";
        echo "   - Windows: memurai.exe or redis-server.exe\n";
        echo "   - Linux: sudo service redis-server start\n";
        echo "   - Docker: docker run -d -p 6379:6379 redis\n\n";
        exit(1);
    }
    
    // Test ping
    $pong = $redis->ping();
    if ($pong) {
        echo "✅ Redis is RUNNING\n";
        echo "🔗 Connected to 127.0.0.1:6379\n\n";
        
        // Get info
        $info = $redis->info();
        echo "📊 Redis Stats:\n";
        echo "   Version: " . ($info['redis_version'] ?? 'N/A') . "\n";
        echo "   Memory: " . ($info['used_memory_human'] ?? 'N/A') . "\n";
        echo "   Clients: " . ($info['connected_clients'] ?? 'N/A') . "\n";
        echo "   Uptime: " . ($info['uptime_in_seconds'] ?? 0) . " seconds\n";
        echo "   Keys: " . ($redis->dbSize() ?? 0) . "\n\n";
        
        // Test write
        $testKey = 'appointease:test:' . time();
        $redis->setex($testKey, 5, 'test');
        $value = $redis->get($testKey);
        
        if ($value === 'test') {
            echo "✅ Redis READ/WRITE working\n";
            $redis->del($testKey);
        } else {
            echo "⚠️ Redis READ/WRITE failed\n";
        }
        
        echo "\n🎯 Result: Redis is READY for AppointEase\n";
        exit(0);
    }
    
} catch (Exception $e) {
    echo "❌ Redis Error: " . $e->getMessage() . "\n";
    exit(1);
}
