# ⚡ Quick Latency Test (30 seconds)

## Easiest Way - Copy & Paste

### Step 1: Open Browser Console
- Press `F12` on your keyboard
- Click "Console" tab

### Step 2: Copy This Line
```javascript
(async()=>{const m=[];const t=async(n,f)=>{const s=performance.now();try{await f();const d=performance.now()-s;m.push({n,d});console.log(`${d<10?'🟢':d<50?'🟡':'🔴'} ${n}: ${d.toFixed(1)}ms`);return d}catch(e){console.log(`❌ ${n}: ${e.message}`)}};const c=`test_${Date.now()}`;const d='2024-01-15';const e=1;const a='/wp-json/appointease/v1';console.log('⚡ Testing...\n');await t('Select',async()=>await fetch(`${a}/slots/select`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d,time:'09:00',employee_id:e,client_id:c})}));for(let i=0;i<5;i++)await t(`Change${i+1}`,async()=>await fetch(`${a}/slots/select`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d,time:`${9+Math.floor(i/6)}:${String((i%6)*10).padStart(2,'0')}`,employee_id:e,client_id:c})}));await t('Deselect',async()=>await fetch(`${a}/slots/deselect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d,time:'10:00',employee_id:e})}));const ds=m.map(x=>x.d).sort((a,b)=>a-b);const avg=ds.reduce((a,b)=>a+b,0)/ds.length;console.log(`\n📊 Avg: ${avg.toFixed(1)}ms | Min: ${ds[0].toFixed(1)}ms | Max: ${ds[ds.length-1].toFixed(1)}ms`);console.log(avg<10?'✅ EXCELLENT':avg<50?'⚠️ GOOD':'❌ SLOW');})();
```

### Step 3: Paste & Press Enter

### Step 4: Read Results
```
⚡ Testing...

🟢 Select: 4.2ms
🟢 Change1: 3.8ms
🟢 Change2: 2.9ms
🟢 Change3: 3.1ms
🟢 Change4: 2.7ms
🟢 Change5: 3.4ms
🟢 Deselect: 2.5ms

📊 Avg: 3.2ms | Min: 2.5ms | Max: 4.2ms
✅ EXCELLENT
```

## What Do The Colors Mean?

- 🟢 **Green (<10ms)** - EXCELLENT! Your system is fast
- 🟡 **Yellow (10-50ms)** - GOOD, acceptable performance
- 🔴 **Red (>50ms)** - SLOW, needs optimization

## What Gets Tested?

1. **Select** - First slot selection
2. **Change1-5** - Rapid slot changes (5 times)
3. **Deselect** - Slot release

Total: **7 operations** in ~5 seconds

## Troubleshooting

### ❌ Error: "fetch is not defined"
- You're in Node.js console, not browser
- Open your booking page in Chrome/Firefox
- Press F12 there

### ❌ Error: "HTTP 404"
- Plugin not activated
- Wrong URL (check `/wp-json/appointease/v1/`)

### ❌ All operations show 🔴 Red (>50ms)
**Possible causes:**
- Redis not running → Start Redis
- Slow database → Add indexes
- Network issues → Check server
- High server load → Check `top` command

## Quick Fixes

### If Slow (>50ms):
```bash
# Check Redis
redis-cli ping

# Restart Redis
redis-cli FLUSHALL
sudo systemctl restart redis

# Check MySQL
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### If Errors:
```bash
# Check WordPress
tail -f wp-content/debug.log

# Check PHP errors
tail -f /var/log/php-fpm/error.log

# Check Apache/Nginx
tail -f /var/log/apache2/error.log
```

## Advanced Test (More Details)

If you want more detailed results, use the full test:
```javascript
// See test-latency-console.js
await runLatencyTest()
```

---

**That's it!** One line, 30 seconds, instant results. ⚡
