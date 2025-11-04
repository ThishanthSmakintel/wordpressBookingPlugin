# Redis Optimization Guide

## Implemented Features

✅ SETEX (auto-expiration)
✅ SETNX (atomic locking)
✅ SCAN (non-blocking)
✅ Health check key
✅ Graceful failover

## Configuration

```bash
# Memory
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Persistence
redis-cli CONFIG SET appendonly yes
redis-cli CONFIG SET appendfsync everysec

# Notifications (optional)
redis-cli CONFIG SET notify-keyspace-events Ex
```

## Key Naming

```
appointease_active_{date}_{employee}_{time}  # Active selections
appointease_lock_{date}_{employee}_{time}    # Slot locks
appointease:health:ping                      # Health check
```

## Performance Benchmarks

| Operation | Time |
|-----------|------|
| SETEX | <1ms |
| SET NX | <5ms |
| GET | <1ms |
| SCAN | <5ms |
| Health Check | <1ms |

## Monitoring

```bash
# Status
redis-cli PING

# Memory
redis-cli INFO memory

# Slow queries
redis-cli SLOWLOG GET 10

# Connected clients
redis-cli CLIENT LIST
```

## Production Checklist

- [ ] Enable AOF persistence
- [ ] Set memory limit (256MB)
- [ ] Monitor slow queries
- [ ] Test failover
- [ ] Set up alerts

## Security

```conf
bind 127.0.0.1
requirepass your_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

## Troubleshooting

```bash
# Check status
redis-cli PING

# Check memory
redis-cli INFO memory

# Restart
sudo systemctl restart redis-server
```
