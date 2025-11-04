# Production Checklist

## Pre-Deployment

- [ ] Backup database
- [ ] Test on staging
- [ ] Verify Redis configuration
- [ ] Check WordPress compatibility

## Redis Configuration

```bash
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET appendonly yes
redis-cli CONFIG SET appendfsync everysec
```

## Security

```conf
# redis.conf
bind 127.0.0.1
requirepass strong_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

## Monitoring

```bash
# Health
redis-cli PING

# Memory
redis-cli INFO memory | grep used_memory_human

# Performance
redis-cli SLOWLOG GET 10

# Clients
redis-cli CLIENT LIST | wc -l
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Slot selection | <50ms |
| Heartbeat poll | <100ms |
| Booking creation | <200ms |
| Redis operations | <5ms |
| Uptime | 99.9% |

## Deployment Steps

1. Upload plugin files
2. Activate plugin
3. Configure Redis in admin
4. Test booking flow
5. Monitor for 24 hours

## Alerts

- Memory > 80%
- Hit rate < 90%
- Slow queries > 10ms
- Failover > 5/hour

## Troubleshooting

```bash
# Redis issues
redis-cli PING
redis-cli INFO memory
sudo systemctl restart redis-server

# Performance
redis-cli SLOWLOG GET 10
redis-cli MONITOR
```
