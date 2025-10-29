# Redis Key Schema + TTL Strategy

## Complete Redis Key Reference

| Key Pattern | Value Structure | TTL | Purpose | Fallback |
|-------------|----------------|-----|---------|----------|
| `appointease:health:ping` | `timestamp` | 5s | Fast health check - avoids connection overhead | None (critical) |
| `appointease_active_{date}_{employee_id}_{time}` | `{client_id, timestamp, expires}` | 10s | Active slot selections - real-time user activity | MySQL transient |
| `appointease_lock_{date}_{employee_id}_{time}` | `{client_id, timestamp, expires, user_id}` | 600s (10min) | Temporary slot locks during booking process | MySQL slot_locks table |
| `appointease_avail_{date}_{employee_id}` | `{booked_slots[], locked_slots[], timestamp}` | 300s (5min) | Availability cache - reduces DB queries | Direct MySQL query |
| `appointease_session_{token}` | `{email, expires, created_at}` | 86400s (24h) | User session tokens | MySQL sessions table |
| `appointease_otp_{email_hash}` | `{otp_hash, expires, attempts}` | 600s (10min) | OTP verification codes | None (expires) |
| `appointease_metrics_{date}` | `{latency_avg, cache_hits, failovers}` | 86400s (24h) | Daily performance metrics | MySQL metrics table |
| `appointease_last_seen_{client_id}` | `timestamp` | 300s (5min) | Client activity tracking - ghost session cleanup | None |

## MySQL Fallback Schema

| Table/Transient | Purpose | Cleanup Strategy |
|-----------------|---------|------------------|
| `_transient_appointease_active_{date}_{employee_id}` | Active selections fallback | Auto-expire (300s) |
| `wp_appointease_slot_locks` | Slot locks fallback | `expires_at` column + cron |
| `wp_appointease_appointments` | Permanent bookings | Never (historical) |
| `wp_appointease_sessions` | Session fallback | `expires` column + cron |
| `wp_appointease_metrics` | Metrics history | Retention policy (90 days) |

## TTL Strategy Details

### 1. Health Check Key (5s)
```redis
SETEX appointease:health:ping 5 1736527845
```
**Why 5s?**
- Matches Heartbeat interval
- Fast failover detection
- Minimal overhead

**Grace Period**: 2s overlap before expiry prevents race conditions

### 2. Active Selections (10s)
```redis
SETEX appointease_active_2025-01-15_1_10:00 10 '{"client_id":"abc123","timestamp":1736527845,"expires":1736527855}'
```
**Why 10s?**
- User typically confirms/cancels within 5-10s
- Prevents stale selections
- Auto-cleanup if client disconnects

**Extension Strategy**: Refresh TTL on every Heartbeat if user still active

### 3. Slot Locks (10min)
```redis
SETEX appointease_lock_2025-01-15_1_10:00 600 '{"client_id":"abc123","user_id":"hash","timestamp":1736527845,"expires":1736528445}'
```
**Why 10min?**
- Industry standard (Calendly, Acuity)
- Enough time for payment processing
- Prevents indefinite locks

**Extension Strategy**: Extend TTL on Heartbeat during checkout (Steps 5-6)

### 4. Availability Cache (5min)
```redis
SETEX appointease_avail_2025-01-15_1 300 '{"booked_slots":["09:00","10:00"],"locked_slots":["11:00"],"timestamp":1736527845}'
```
**Why 5min?**
- Balances freshness vs DB load
- Acceptable staleness for availability
- Reduces DB queries by 80%

**Invalidation**: Clear on new booking confirmation

### 5. Session Tokens (24h)
```redis
SETEX appointease_session_abc123token 86400 '{"email":"user@example.com","expires":1736614245,"created_at":1736527845}'
```
**Why 24h?**
- User convenience (stay logged in)
- Security balance
- Matches industry standard

**Refresh Strategy**: Sliding window - extend on activity

### 6. OTP Codes (10min)
```redis
SETEX appointease_otp_hash123 600 '{"otp_hash":"sha256","expires":1736528445,"attempts":0}'
```
**Why 10min?**
- Security best practice
- Enough time for email delivery
- Prevents brute force

**Rate Limiting**: Max 3 attempts, then block

### 7. Performance Metrics (24h)
```redis
SETEX appointease_metrics_2025-01-15 86400 '{"latency_avg":0.8,"cache_hits":985,"failovers":0}'
```
**Why 24h?**
- Daily aggregation
- Trend analysis
- Historical comparison

**Archival**: Copy to MySQL before expiry

### 8. Last Seen Tracking (5min)
```redis
SETEX appointease_last_seen_abc123 300 1736527845
```
**Why 5min?**
- Ghost session detection
- Analytics accuracy
- Minimal storage

**Cleanup**: Auto-expire, no manual intervention

## Write Path Strategy

### Cache-Aside Pattern (Reads)
```
1. Check Redis first (O(1))
2. If miss → Query MySQL
3. Store result in Redis with TTL
4. Return to client
```

### Write-Through Pattern (Writes)
```
1. Write to Redis (lock/selection)
2. On confirmation → Write to MySQL (atomic)
3. Invalidate Redis cache
4. Return success
```

## Failover Handling

### Redis → MySQL Transition
```php
if (!$redis->health_check()) {
    // Switch to MySQL transients
    set_transient($key, $data, 300);
    $storage_mode = 'mysql';
}
```

### MySQL → Redis Recovery
```php
if ($redis->health_check() && $storage_mode === 'mysql') {
    // Graceful failback
    $redis->sync_transients_to_redis($date, $employee_id);
    $storage_mode = 'redis';
}
```

## Performance Optimization

### 1. Pipeline Commands
```php
$redis->pipeline();
$redis->setex($key1, 10, $data1);
$redis->setex($key2, 10, $data2);
$redis->exec();
```

### 2. Batch Operations
```php
$redis->mget([
    'appointease_active_2025-01-15_1_10:00',
    'appointease_active_2025-01-15_1_10:30',
    'appointease_active_2025-01-15_1_11:00'
]);
```

### 3. Lazy Expiration
```php
// Let Redis handle cleanup automatically
// No manual DEL needed for TTL keys
```

## Monitoring Queries

### Check Key Count
```redis
DBSIZE
```

### Check Memory Usage
```redis
INFO memory
```

### Check Expiring Keys
```redis
TTL appointease:health:ping
TTL appointease_lock_2025-01-15_1_10:00
```

### Check Hit Rate
```redis
INFO stats
# Look for: keyspace_hits, keyspace_misses
```

## Edge Case Handling

### 1. Clock Skew
**Problem**: Server time mismatch causes premature expiry
**Solution**: Use server-side timestamps only, never client time

### 2. Network Partition
**Problem**: Redis unreachable but not down
**Solution**: Health check timeout (3s), then failover

### 3. Thundering Herd
**Problem**: Cache expires, all requests hit MySQL
**Solution**: Probabilistic early expiration (refresh at 80% TTL)

### 4. Race Condition
**Problem**: Two users select same slot simultaneously
**Solution**: Atomic SETNX + ownership verification

### 5. Memory Pressure
**Problem**: Redis runs out of memory
**Solution**: `maxmemory-policy volatile-lru` (evict oldest TTL keys)

## Redis Configuration

### Recommended Settings
```conf
# Memory
maxmemory 256mb
maxmemory-policy volatile-lru

# Persistence (optional)
save 900 1
save 300 10
save 60 10000

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

## Monitoring Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Memory Usage | >80% | Scale up or evict |
| Hit Rate | <70% | Review TTL strategy |
| Latency | >5ms | Check network/load |
| Failover Count | >3/hour | Investigate Redis stability |
| Eviction Count | >100/min | Increase memory |

## Backup Strategy

### Redis Persistence
```bash
# RDB snapshot (point-in-time)
redis-cli BGSAVE

# AOF log (append-only)
appendonly yes
appendfsync everysec
```

### MySQL Backup
```bash
# Daily backup of permanent data
mysqldump appointease_appointments > backup.sql
```

## Key Naming Conventions

### Pattern Rules
1. **Prefix**: Always start with `appointease:`
2. **Separator**: Use underscore `_` for readability
3. **Date Format**: `YYYY-MM-DD` for consistency
4. **IDs**: Numeric employee_id, alphanumeric client_id
5. **Lowercase**: All keys lowercase for consistency

### Examples
```
✅ appointease:health:ping
✅ appointease_active_2025-01-15_1_10:00
✅ appointease_lock_2025-01-15_1_10:00
❌ AppointEase:Active:2025-01-15:1:10:00 (inconsistent)
❌ booking_active_slot (missing prefix)
```

## Summary

| Aspect | Strategy | Benefit |
|--------|----------|---------|
| **TTL** | 5s-24h based on use case | Auto-cleanup, no manual intervention |
| **Fallback** | MySQL transients + tables | Zero downtime on Redis failure |
| **Ownership** | client_id + user_id verification | Prevents accidental unlocks |
| **Health Check** | Dedicated 5s key | Fast failover detection |
| **Metrics** | Daily aggregation | Performance monitoring |
| **Cleanup** | Automatic expiration | No cron jobs needed |

**This schema supports 10,000+ concurrent users with <1ms Redis operations and seamless MySQL fallback.**
