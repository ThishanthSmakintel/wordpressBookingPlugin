# Redis Quick Start - Fix 78ms Latency

## Problem
❌ **Redis is NOT running** → Using slow MySQL transients (78ms)
✅ **Redis running** → Fast operations (<5ms)

## Windows Setup (XAMPP)

### Option 1: Memurai (Recommended for Windows)
```bash
# 1. Download Memurai (Redis for Windows)
https://www.memurai.com/get-memurai

# 2. Install and start
# Memurai runs as Windows service automatically

# 3. Test
memurai-cli ping
# Should return: PONG
```

### Option 2: Redis via WSL2
```bash
# 1. Enable WSL2
wsl --install

# 2. Install Redis in WSL
sudo apt update
sudo apt install redis-server

# 3. Start Redis
sudo service redis-server start

# 4. Test
redis-cli ping
# Should return: PONG
```

### Option 3: Docker (Fastest)
```bash
# 1. Install Docker Desktop for Windows
https://www.docker.com/products/docker-desktop

# 2. Run Redis
docker run -d -p 6379:6379 --name redis redis:latest

# 3. Test
docker exec -it redis redis-cli ping
# Should return: PONG
```

## Verify Redis is Working

### Test 1: Command Line
```bash
redis-cli ping
# Expected: PONG
```

### Test 2: Browser Console
```javascript
// Paste this in browser console
(async()=>{
    const r = await fetch('/wp-json/appointease/v1/redis/stats');
    const d = await r.json();
    console.log(d.enabled ? '✅ Redis ENABLED' : '❌ Redis DISABLED');
})();
```

### Test 3: Latency Test
```javascript
// Should show <10ms after Redis is enabled
(async()=>{const m=[];const t=async(n,f)=>{const s=performance.now();try{await f();const d=performance.now()-s;m.push({n,d});console.log(`${d<10?'🟢':d<50?'🟡':'🔴'} ${n}: ${d.toFixed(1)}ms`);return d}catch(e){console.log(`❌ ${n}: ${e.message}`)}};const c=`test_${Date.now()}`;const d='2024-01-15';const e=1;const a='/wp-json/appointease/v1';console.log('⚡ Testing...\n');await t('Select',async()=>await fetch(`${a}/slots/select`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d,time:'09:00',employee_id:e,client_id:c})}));for(let i=0;i<5;i++)await t(`Change${i+1}`,async()=>await fetch(`${a}/slots/select`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d,time:`${9+Math.floor(i/6)}:${String((i%6)*10).padStart(2,'0')}`,employee_id:e,client_id:c})}));await t('Deselect',async()=>await fetch(`${a}/slots/deselect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d,time:'10:00',employee_id:e})}));const ds=m.map(x=>x.d).sort((a,b)=>a-b);const avg=ds.reduce((a,b)=>a+b,0)/ds.length;console.log(`\n📊 Avg: ${avg.toFixed(1)}ms | Min: ${ds[0].toFixed(1)}ms | Max: ${ds[ds.length-1].toFixed(1)}ms`);console.log(avg<10?'✅ EXCELLENT':avg<50?'⚠️ GOOD':'❌ SLOW');})();
```

## Expected Results

### Before Redis (Current)
```
🔴 API Call: 78.3ms
🔴 Redis Check: 133.2ms
🔴 DB Query: 83.8ms
📊 Avg: 78ms
❌ SLOW
```

### After Redis (Target)
```
🟢 Select: 4.2ms
🟢 Change1: 2.8ms
🟢 Change2: 2.1ms
📊 Avg: 2.6ms
✅ EXCELLENT
```

## Troubleshooting

### Redis not connecting?
```bash
# Check if Redis is running
redis-cli ping

# Check Redis port
netstat -an | findstr 6379

# Restart Redis
# Memurai: Services → Memurai → Restart
# WSL: sudo service redis-server restart
# Docker: docker restart redis
```

### Still slow after enabling Redis?
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Restart PHP
# XAMPP: Stop/Start Apache

# Check PHP Redis extension
php -m | findstr redis
```

### Permission errors?
```bash
# Run Redis as administrator
# Or check firewall settings
```

## Performance Comparison

| Scenario | Latency | Speed |
|----------|---------|-------|
| **No Redis (MySQL)** | 78ms | 🔴 Slow |
| **Redis Enabled** | <5ms | 🟢 Fast |
| **Improvement** | **15x faster** | ⚡ |

## Quick Commands

```bash
# Start Redis
redis-server

# Test Redis
redis-cli ping

# Monitor Redis
redis-cli MONITOR

# Check memory
redis-cli INFO memory

# Clear all data
redis-cli FLUSHALL
```

## Next Steps

1. ✅ Install Redis (choose option above)
2. ✅ Start Redis server
3. ✅ Run browser test
4. ✅ Verify <10ms latency

---

**Current Status**: ❌ Redis NOT running (78ms latency)
**Target Status**: ✅ Redis running (<5ms latency)
**Action Required**: Install and start Redis
