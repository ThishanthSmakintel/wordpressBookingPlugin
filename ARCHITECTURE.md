# AppointEase Architecture

## Real-Time System

**WordPress Heartbeat (1s polling) + Redis Pub/Sub**

```
Frontend → Heartbeat API → Redis Pub/Sub → All Clients
  React      1s polling      <5ms broadcast    Instant updates
```

### Why No WebSocket?
- WordPress Heartbeat handles polling
- Redis Pub/Sub handles broadcasting
- Works on any hosting (no separate server)
- Industry standard (Calendly/Acuity pattern)

## Storage Architecture

**Redis-Primary with MySQL Fallback**

```
Redis (Primary)          MySQL (Fallback)
├─ Slot locks (10min)   ├─ Appointments
├─ Active selections    ├─ Slot locks
├─ Availability cache   ├─ Services
└─ Sessions (24h)       └─ Staff
```

## Performance

- **Slot selection**: <100ms (optimistic UI)
- **Real-time updates**: 1-second polling
- **Redis operations**: <1ms
- **Conflict detection**: <5ms via Pub/Sub

## Key Files

### Backend (PHP)
- `includes/class-heartbeat-handler.php` - Real-time polling
- `includes/class-redis-helper.php` - Redis operations
- `includes/class-redis-pubsub.php` - Broadcasting
- `includes/class-api-endpoints.php` - REST API
- `includes/class-atomic-booking.php` - Race condition prevention

### Frontend (React)
- `src/hooks/useHeartbeat.ts` - Heartbeat integration
- `src/hooks/useHeartbeatSlotPolling.ts` - Slot polling
- `src/services/redisDataService.ts` - Redis API client
- `src/components/forms/TimeSelector.tsx` - Slot selection UI

## Security

- Session-based authentication
- OTP email verification
- Atomic database operations
- Input sanitization
- CSRF protection via nonces
