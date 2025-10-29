# React Frontend Latency Testing

Comprehensive performance testing tools to identify bottlenecks in the AppointEase booking flow.

## 🎯 What Gets Measured

### Frontend Operations
- ✅ **Slot Selection** - Time to select/change time slots
- ✅ **API Calls** - Network latency for REST endpoints
- ✅ **React Re-renders** - Component update performance
- ✅ **WordPress Heartbeat** - Polling interval latency
- ✅ **DOM Operations** - Query and manipulation speed
- ✅ **localStorage** - Client-side storage performance
- ✅ **State Management** - Redux/store update latency

### Backend Operations (via API)
- ✅ **Redis Operations** - Cache read/write speed
- ✅ **MySQL Queries** - Database transaction time
- ✅ **Slot Locking** - Atomic lock acquisition
- ✅ **Availability Checks** - Date/time validation

## 🚀 Quick Start

### Method 1: Browser Console (Recommended)

1. Open your booking page in browser
2. Open DevTools Console (F12)
3. Copy contents of `test-latency-console.js`
4. Paste into console and press Enter
5. Run: `await runLatencyTest()`

```javascript
// Example output:
⚡ Starting React Frontend Latency Test...

✅ API: Select Slot: 4.23ms
✅ Change 1 (09:00): 3.87ms
✅ Change 2 (09:10): 2.91ms
...
📊 Summary Statistics:
   Avg Latency: 5.42ms
   P95: 12.34ms
   P99: 18.76ms
```

### Method 2: React Component

1. Import the component:
```tsx
import LatencyTest from './components/LatencyTest';
```

2. Add to your app:
```tsx
<LatencyTest />
```

3. Click "Run Tests" button

### Method 3: Standalone Page

1. Navigate to: `http://your-site.com/wp-content/plugins/wordpressBookingPlugin/test-latency.html`
2. Click "Run Tests"
3. Export results as JSON

## 📊 Understanding Results

### Latency Benchmarks

| Operation | Excellent | Good | Needs Work |
|-----------|-----------|------|------------|
| Slot Selection | <5ms | 5-20ms | >20ms |
| API Calls | <10ms | 10-50ms | >50ms |
| React Re-render | <16ms | 16-50ms | >50ms |
| Heartbeat Poll | <100ms | 100-500ms | >500ms |
| DOM Query | <1ms | 1-5ms | >5ms |

### Performance Metrics

- **P50 (Median)** - 50% of operations complete within this time
- **P95** - 95% of operations complete within this time (target for SLA)
- **P99** - 99% of operations complete within this time (worst-case)

### Color Coding

- 🟢 **Green (<10ms)** - Excellent performance
- 🟡 **Yellow (10-50ms)** - Good performance
- 🔴 **Red (>50ms)** - Optimization needed

## 🔍 Common Bottlenecks

### 1. Slow Slot Selection (>20ms)

**Causes:**
- Network latency to API
- Redis connection issues
- Multiple re-renders

**Solutions:**
```typescript
// Use Set instead of Array for O(1) lookups
const unavailableSet = useMemo(() => new Set(unavailableSlots), [unavailableSlots]);

// Use useRef to prevent re-renders during async operations
const selectingRef = useRef(false);
```

### 2. Heartbeat Lag (>500ms)

**Causes:**
- Heartbeat interval too long
- Large payload size
- Server processing time

**Solutions:**
```php
// Reduce heartbeat interval
wp.heartbeat.interval(1); // 1 second

// Optimize payload
return array(
    'booked_slots' => array_values($booked), // Remove keys
    'locked_slots' => array_values($locked)
);
```

### 3. Component Re-render Storms

**Causes:**
- Missing memoization
- Inline function creation
- Unnecessary state updates

**Solutions:**
```typescript
// Memoize expensive computations
const unavailableSet = useMemo(() => new Set(slots), [slots]);

// Memoize callbacks
const handleSelect = useCallback((time) => {
    selectSlot(time);
}, [selectSlot]);

// Memoize components
const TimeSlot = memo(({ time, onSelect }) => { ... });
```

### 4. API Latency (>50ms)

**Causes:**
- Database queries without indexes
- N+1 query problems
- Missing Redis cache

**Solutions:**
```php
// Add database indexes
$wpdb->query("CREATE INDEX idx_date_employee ON wp_appointments(appointment_date, employee_id)");

// Use Redis for hot data
$cached = $redis->get("slots_{$date}_{$employee_id}");
if ($cached) return $cached;

// Batch queries
$appointments = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM wp_appointments WHERE appointment_date IN (%s, %s, %s)",
    $date1, $date2, $date3
));
```

## 📈 Performance Targets

### Production SLA

| Metric | Target | Critical |
|--------|--------|----------|
| Slot Selection | <10ms | <20ms |
| API Response | <50ms | <100ms |
| Heartbeat Poll | <100ms | <500ms |
| Page Load | <1s | <2s |
| Success Rate | >99.9% | >99% |

### Optimization Goals

1. **P95 < 20ms** for all slot operations
2. **P99 < 50ms** for API calls
3. **Zero failed operations** under normal load
4. **<100ms** end-to-end booking flow

## 🛠️ Debugging Tips

### Enable Performance Profiling

```javascript
// In browser console
performance.mark('slot-select-start');
await selectSlot(date, time, employeeId, clientId);
performance.mark('slot-select-end');
performance.measure('slot-select', 'slot-select-start', 'slot-select-end');
console.table(performance.getEntriesByType('measure'));
```

### Monitor Network Waterfall

1. Open DevTools → Network tab
2. Filter by "appointease"
3. Look for:
   - Long wait times (server processing)
   - Large payload sizes (>10KB)
   - Failed requests (red)

### React DevTools Profiler

1. Install React DevTools extension
2. Open Profiler tab
3. Click "Record"
4. Perform slot selection
5. Stop recording
6. Analyze component render times

### WordPress Debug Log

```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// In code
error_log('[Latency] Slot selection took: ' . (microtime(true) - $start) . 's');
```

## 📦 Export & Analysis

### JSON Export Format

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "metrics": [
    {
      "name": "API: Select Slot",
      "duration": 4.23,
      "success": true,
      "error": null
    }
  ],
  "stats": {
    "total": 25,
    "avg": 5.42,
    "p95": 12.34,
    "p99": 18.76
  }
}
```

### Analysis Tools

- **Excel/Google Sheets** - Import JSON for charts
- **Grafana** - Real-time monitoring dashboard
- **New Relic** - APM integration
- **Chrome DevTools** - Performance timeline

## 🎯 Next Steps

1. **Run baseline test** - Establish current performance
2. **Identify bottlenecks** - Focus on P95/P99 outliers
3. **Optimize** - Apply fixes from this guide
4. **Re-test** - Verify improvements
5. **Monitor** - Set up continuous performance tracking

## 📚 Related Documentation

- [REDIS_OPTIMIZATION.md](REDIS_OPTIMIZATION.md) - Redis performance tuning
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Deployment checklist
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

## 🆘 Support

If latency issues persist after optimization:

1. Check Redis connection: `redis-cli ping`
2. Verify database indexes: `SHOW INDEX FROM wp_appointments`
3. Monitor server resources: `top`, `htop`
4. Review error logs: `tail -f wp-content/debug.log`
5. Test network latency: `ping your-server.com`

---

**Performance is a feature.** Keep testing, keep optimizing! ⚡
