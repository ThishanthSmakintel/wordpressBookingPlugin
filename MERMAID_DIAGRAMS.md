# Mermaid Architecture Diagrams

## Complete System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[User Action] --> B[React Component]
        B --> C[redisDataService.ts]
        C --> D[useHeartbeat.ts]
    end
    
    subgraph "WordPress Heartbeat Layer"
        D --> E[WordPress Heartbeat API]
        E -->|5s polling| F[heartbeat-send event]
        F --> G[Backend PHP]
        G --> H[heartbeat-tick event]
        H --> D
    end
    
    subgraph "Backend Processing"
        G --> I[class-heartbeat-handler.php]
        I --> J[class-redis-helper.php]
        J --> K{Redis Available?}
    end
    
    subgraph "Data Storage"
        K -->|Yes| L[Redis Primary]
        K -->|No| M[MySQL Fallback]
        L -->|Failover| M
        M -->|Recovery| L
    end
    
    L --> N[Active Selections<br/>10s TTL]
    L --> O[Slot Locks<br/>10min TTL]
    L --> P[Availability Cache<br/>5min TTL]
    L --> Q[Health Check Key<br/>5s TTL]
    
    M --> R[Transients<br/>5min TTL]
    M --> S[Slot Locks Table]
    M --> T[Appointments Table]
    
    style L fill:#ff6b6b
    style M fill:#4ecdc4
    style Q fill:#ffe66d
```

## Slot Selection Flow with Lock Ownership

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant R as redisDataService
    participant H as Heartbeat
    participant B as Backend
    participant RD as Redis
    participant MY as MySQL
    
    U->>F: Click slot "10:00"
    F->>R: selectSlot(date, time, employeeId, clientId)
    R->>H: POST /slots/select
    H->>B: Process request
    
    B->>RD: Health check (appointease:health:ping)
    
    alt Redis Available
        RD-->>B: Health key exists
        B->>RD: SETEX appointease_active_*<br/>{client_id, timestamp, expires}
        RD-->>B: OK (<1ms)
        B-->>H: {success: true, storage: 'redis'}
    else Redis Unavailable
        RD-->>B: Health key missing
        B->>MY: set_transient(key, data, 300s)
        MY-->>B: OK (~10ms)
        B-->>H: {success: true, storage: 'mysql'}
    end
    
    H-->>R: Response
    R-->>F: Update UI
    F-->>U: Slot marked as selected
    
    Note over B,RD: Lock includes client_id<br/>for ownership verification
```

## Automatic Failover & Recovery

```mermaid
stateDiagram-v2
    [*] --> RedisMode: System Start
    
    RedisMode: Redis Primary Mode
    RedisMode: ✅ <1ms operations
    RedisMode: ✅ Health key active
    
    MySQLMode: MySQL Fallback Mode
    MySQLMode: ⚠️ ~10ms operations
    MySQLMode: ⚠️ Transients used
    
    RedisMode --> HealthCheck: Every 5s
    HealthCheck --> RedisMode: Health key exists
    HealthCheck --> MySQLMode: Health key missing
    
    MySQLMode --> HealthCheck2: Every 5s
    HealthCheck2 --> MySQLMode: Still unavailable
    HealthCheck2 --> SyncMode: Redis recovered!
    
    SyncMode: Graceful Failback
    SyncMode: 🔄 Sync transients → Redis
    SyncMode: 🔄 Preserve active selections
    
    SyncMode --> RedisMode: Sync complete
    
    note right of HealthCheck
        Fast health check using
        appointease:health:ping key
        (avoids connection overhead)
    end note
    
    note right of SyncMode
        Prevents desync period
        by copying MySQL data
        back to Redis
    end note
```

## Lock Ownership Verification

```mermaid
flowchart TD
    A[User A selects slot] --> B{Check existing lock}
    B -->|No lock| C[Create lock with client_id_A]
    B -->|Lock exists| D{Check ownership}
    
    D -->|client_id matches| E[Refresh lock timestamp]
    D -->|client_id different| F[Reject: Slot taken]
    
    C --> G[Store in Redis/MySQL]
    G --> H{Lock data structure}
    
    H --> I[client_id: 'abc123']
    H --> J[timestamp: 1736527845]
    H --> K[expires: 1736528445]
    
    L[User B tries to unlock] --> M{Verify ownership}
    M -->|client_id matches| N[Delete lock allowed]
    M -->|client_id mismatch| O[Delete denied]
    
    style F fill:#ff6b6b
    style O fill:#ff6b6b
    style N fill:#51cf66
    style E fill:#51cf66
```

## Redis Pub/Sub & Stream (Future-Proofing)

```mermaid
graph LR
    subgraph "Current Implementation"
        A[Booking Confirmed] --> B[Direct Response]
        B --> C[Frontend Update]
    end
    
    subgraph "Future: Redis Pub/Sub"
        D[Booking Event] --> E[Redis PUBLISH]
        E --> F1[Channel: bookings]
        F1 --> G1[Subscriber 1: Email Service]
        F1 --> G2[Subscriber 2: SMS Service]
        F1 --> G3[Subscriber 3: Analytics]
    end
    
    subgraph "Future: Redis Stream"
        H[Async Task] --> I[Redis XADD]
        I --> J[Stream: tasks]
        J --> K1[Consumer 1: Webhooks]
        J --> K2[Consumer 2: Notifications]
        J --> K3[Consumer 3: Integrations]
    end
    
    style E fill:#ffe66d
    style I fill:#ffe66d
```

## Performance Comparison

```mermaid
graph TD
    subgraph "Redis Mode Performance"
        R1[Slot Selection: <1ms]
        R2[Availability Check: <5ms]
        R3[Active Selections: <2ms]
        R4[Heartbeat Response: ~50ms]
    end
    
    subgraph "MySQL Mode Performance"
        M1[Slot Selection: ~10ms]
        M2[Availability Check: ~50ms]
        M3[Active Selections: ~20ms]
        M4[Heartbeat Response: ~100ms]
    end
    
    R1 -.->|10x faster| M1
    R2 -.->|10x faster| M2
    R3 -.->|10x faster| M3
    R4 -.->|2x faster| M4
    
    style R1 fill:#51cf66
    style R2 fill:#51cf66
    style R3 fill:#51cf66
    style R4 fill:#51cf66
    
    style M1 fill:#ffd43b
    style M2 fill:#ffd43b
    style M3 fill:#ffd43b
    style M4 fill:#ffd43b
```

## Data Flow Timeline

```mermaid
gantt
    title Booking Process Timeline (Redis vs MySQL)
    dateFormat X
    axisFormat %Lms
    
    section Redis Mode
    User clicks slot           :0, 1
    Frontend request          :1, 5
    Backend processing        :5, 6
    Redis write              :6, 7
    Response to frontend     :7, 10
    UI update                :10, 15
    
    section MySQL Mode
    User clicks slot           :0, 1
    Frontend request          :1, 5
    Backend processing        :5, 10
    MySQL write              :10, 30
    Response to frontend     :30, 35
    UI update                :35, 40
```

## Health Check Flow

```mermaid
sequenceDiagram
    participant H as Heartbeat (5s)
    participant B as Backend
    participant R as Redis
    participant K as Health Key
    
    loop Every 5 seconds
        H->>B: Heartbeat tick
        B->>R: GET appointease:health:ping
        
        alt Health key exists
            R-->>B: timestamp (key found)
            B->>B: Redis available ✅
            B-->>H: redis_status: 'available'
        else Health key missing
            R-->>B: null (key not found)
            B->>B: Redis unavailable ⚠️
            B-->>H: redis_status: 'unavailable'
        end
    end
    
    Note over R,K: Health key auto-refreshed<br/>every 5s by backend<br/>TTL: 5 seconds
```

## Graceful Failback Sync

```mermaid
flowchart TD
    A[Redis Crashes] --> B[System switches to MySQL]
    B --> C[Selections stored in transients]
    C --> D[Redis comes back online]
    D --> E{Detect recovery}
    
    E -->|Health check passes| F[Trigger sync]
    F --> G[Read MySQL transients]
    G --> H{Transients exist?}
    
    H -->|Yes| I[Copy to Redis]
    I --> J[Preserve client_id]
    J --> K[Preserve timestamps]
    K --> L[Set appropriate TTL]
    L --> M[Sync complete ✅]
    
    H -->|No| M
    M --> N[Resume Redis mode]
    
    style D fill:#51cf66
    style M fill:#51cf66
    style B fill:#ffd43b
```

## System Health Dashboard

```mermaid
graph TB
    subgraph "Monitoring Metrics"
        A[Redis Status] --> A1[● ONLINE]
        B[Storage Mode] --> B1[Redis Primary]
        C[Heartbeat] --> C1[5s interval]
        D[Active Selections] --> D1[12 slots]
        E[Locked Slots] --> E1[3 slots]
        F[Cache Hit Rate] --> F1[98.5%]
        G[Avg Response] --> G1[0.8ms]
        H[Health Check] --> H1[✅ Passing]
    end
    
    style A1 fill:#51cf66
    style B1 fill:#51cf66
    style H1 fill:#51cf66
```

## Usage Instructions

### Rendering Mermaid Diagrams

**In GitHub/GitLab:**
- Diagrams render automatically in markdown files

**In Documentation Sites:**
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>
```

**In VS Code:**
- Install "Markdown Preview Mermaid Support" extension
- Preview with `Ctrl+Shift+V`

**Online Editor:**
- https://mermaid.live/
- Copy/paste diagrams for editing and export

### Export Options

1. **PNG/SVG**: Use mermaid.live editor
2. **PDF**: Print from browser with diagrams rendered
3. **Embed**: Use mermaid CDN in HTML docs

These diagrams provide visual clarity for developers, DevOps, and stakeholders!
