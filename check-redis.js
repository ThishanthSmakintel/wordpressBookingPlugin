// Quick Redis Check - Paste in browser console
(async()=>{
    console.log('🔍 Checking Redis status...\n');
    
    try {
        const response = await fetch('/wp-json/appointease/v1/redis/stats');
        const data = await response.json();
        
        if (data.enabled) {
            console.log('✅ Redis is ENABLED');
            console.log('📊 Stats:', data.stats);
            console.log('💾 Memory:', data.stats?.used_memory || 'N/A');
            console.log('🔗 Clients:', data.stats?.connected_clients || 'N/A');
            console.log('⚡ Hit Rate:', data.stats?.hit_rate + '%' || 'N/A');
        } else {
            console.log('❌ Redis is DISABLED');
            console.log('⚠️ Using MySQL transients (slower)');
            console.log('\n💡 To enable Redis:');
            console.log('1. Install Redis: https://redis.io/download');
            console.log('2. Start Redis: redis-server');
            console.log('3. Verify: redis-cli ping');
        }
    } catch (error) {
        console.log('❌ Error checking Redis:', error.message);
    }
})();
