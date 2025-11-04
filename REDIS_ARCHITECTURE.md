# Redis Architecture

## Overview

Redis provides <1ms operations with automatic MySQL fallback.

## Data Flow

```
User Action → Redis (primary) OR MySQL (fallback) → Heartbeat (1s) → All Clients
```

## Storage Strategy

### 1. Active Selections (10s TTL)
```
Key: appointease_active_{date}_{employee}_{time}
Value: {client_id, timestamp}
Operation: SETEX
```

### 2. Slot Locks (10min TTL)
```
Key: appointease_lock_{date}_{employee}_{time}
Value: {client_id, timestamp, user_id}
Operation: SET NX (atomic)
```

### 3. Confirmed Bookings (Permanent)
```
Storage: MySQL wp_appointments table
Transaction: ACID with row locking
```

## Redis Operations

| Operation | Command | Latency |
|-----------|---------|---------|
| Select Slot | SETEX | <1ms |
| Lock Slot | SET NX | <5ms |
| Get Selections | GET | <1ms |
| Health Check | GET | <1ms |

## Failover

- **Redis Down**: Auto-switch to MySQL transients
- **Redis Recovery**: Sync transients to Redis
- **Zero Downtime**: Transparent failover

## Performance

| Operation | Redis | MySQL | Improvement |
|-----------|-------|-------|-------------|
| Selection | <1ms | ~10ms | 10x |
| Lock | <5ms | ~15ms | 3x |
| Health Check | <1ms | N/A | Instant |

## Configuration

```bash
# Production settings
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET appendonly yes
```

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for complete setup.
