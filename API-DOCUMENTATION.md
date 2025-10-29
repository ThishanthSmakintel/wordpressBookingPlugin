# AppointEase Plugin - Complete API & Integration Documentation

## Table of Contents
1. [REST API Endpoints](#rest-api-endpoints)
2. [WordPress Heartbeat API](#wordpress-heartbeat-api)
3. [Redis Integration](#redis-integration)
4. [Database Schema](#database-schema)
5. [WordPress Hooks & Filters](#wordpress-hooks--filters)
6. [JavaScript Events](#javascript-events)
7. [Configuration Options](#configuration-options)

---

## REST API Endpoints

### Base URLs
- **Primary**: `/wp-json/appointease/v1/`
- **Legacy**: `/wp-json/booking/v1/` (backward compatibility)

### Authentication
- **Nonce**: `X-WP-Nonce` header
- **Session Token**: `Authorization: Bearer {token}` header

---

### 1. Services Management

#### Get All Services
```http
GET /wp-json/booking/v1/services
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Consultation",
    "duration": 30,
    "price": 50.00,
    "description": "Initial consultation"
  }
]
```

---

### 2. Staff Management

#### Get All Staff
```http
GET /wp-json/booking/v1/staff
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Dr. Smith",
    "email": "smith@clinic.com",
    "specialization": "General Practice"
  }
]
```

---

### 3. Availability System

#### Check Date Availability
```http
POST /wp-json/booking/v1/availability
Content-Type: application/json

{
  "date": "2025-10-28",
  "employee_id": 2
}
```

**Response:**
```json
{
  "unavailable": ["09:00", "10:30", "14:00"],
  "booking_details": {
    "09:00": {
      "customer_name": "Processing",
      "status": "processing",
      "is_locked": true,
      "lock_remaining": 582
    },
    "10:30": {
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "status": "confirmed",
      "booking_id": "APT-2025-000123"
    }
  }
}
```

#### Check Reschedule Availability
```http
POST /wp-json/appointease/v1/reschedule-availability
Content-Type: application/json

{
  "date": "2025-10-28",
  "employee_id": 2,
  "exclude_appointment_id": "APT-2025-000123"
}
```

**Response:** Same as regular availability

---

### 4. Appointment Management

#### Create Appointment
```http
POST /wp-json/appointease/v1/appointments
Content-Type: application/json
X-WP-Nonce: {nonce}

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "date": "2025-10-28 10:00:00",
  "service_id": 1,
  "employee_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "appointment_id": 123,
  "strong_id": "APT-2025-000123",
  "message": "Appointment booked successfully"
}
```

#### Get Appointment
```http
GET /wp-json/appointease/v1/appointments/{id}
```

**Response:**
```json
{
  "id": 123,
  "strong_id": "APT-2025-000123",
  "name": "John Doe",
  "email": "john@example.com",
  "appointment_date": "2025-10-28 10:00:00",
  "service_name": "Consultation",
  "staff_name": "Dr. Smith",
  "status": "confirmed"
}
```

#### Reschedule Appointment
```http
PUT /wp-json/appointease/v1/appointments/{id}
Content-Type: application/json
X-WP-Nonce: {nonce}

{
  "new_date": "2025-10-29 14:00:00",
  "reason": "Schedule conflict"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully"
}
```

#### Cancel Appointment
```http
DELETE /wp-json/appointease/v1/appointments/{id}
X-WP-Nonce: {nonce}

{
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

---

### 5. User Management

#### Get User Appointments
```http
POST /wp-json/appointease/v1/user-appointments
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
[
  {
    "id": "APT-2025-000123",
    "service": "Consultation",
    "staff": "Dr. Smith",
    "date": "2025-10-28 10:00:00",
    "status": "confirmed"
  }
]
```

#### Check Customer by Email
```http
GET /wp-json/appointease/v1/check-customer/{email}
```

**Response:**
```json
{
  "exists": true,
  "name": "John Doe",
  "phone": "555-0123"
}
```

---

### 6. Authentication System

#### Generate OTP
```http
POST /wp-json/appointease/v1/generate-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expires_in": 600
}
```

#### Verify OTP
```http
POST /wp-json/appointease/v1/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "abc123...",
  "expires_in": 86400
}
```

---

### 7. Session Management

#### Create Session
```http
POST /wp-json/appointease/v1/session
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "token": "session_token_here",
  "expires_in": 86400
}
```

#### Get Session
```http
GET /wp-json/appointease/v1/session
Authorization: Bearer {token}
```

**Response:**
```json
{
  "email": "user@example.com"
}
```

#### Delete Session
```http
DELETE /wp-json/appointease/v1/session
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true
}
```

---

### 8. System Utilities

#### Get Server Date/Time
```http
GET /wp-json/appointease/v1/server-date
```

**Response:**
```json
{
  "server_date": "2025-10-28",
  "server_time": "2025-10-28 15:30:45",
  "server_timestamp": 1730127045,
  "timezone": "Asia/Colombo",
  "utc_offset": "+05:30"
}
```

#### Get Time Slots
```http
GET /wp-json/appointease/v1/time-slots
```

**Response:**
```json
{
  "time_slots": ["09:00", "09:30", "10:00", "10:30", "11:00"],
  "slot_duration": 30
}
```

#### Get Business Hours
```http
GET /wp-json/appointease/v1/business-hours
```

**Response:**
```json
{
  "working_days": ["1", "2", "3", "4", "5"],
  "start_time": "09:00",
  "end_time": "17:00",
  "lunch_start": "12:00",
  "lunch_end": "14:00"
}
```

#### Get Settings
```http
GET /wp-json/appointease/v1/settings
```

**Response:**
```json
{
  "business_hours": {
    "start": "09:00",
    "end": "17:00"
  },
  "working_days": ["1", "2", "3", "4", "5"],
  "time_slots": ["09:00", "09:30", "10:00"],
  "slot_duration": 30
}
```

#### Check Specific Slot
```http
POST /wp-json/appointease/v1/check-slot
Content-Type: application/json

{
  "date": "2025-10-28",
  "time": "10:00",
  "employee_id": 2,
  "service_id": 1
}
```

**Response:**
```json
{
  "is_booked": false,
  "available": true,
  "message": "Time slot is available"
}
```

---

### 9. Debug Endpoints (Admin Only)

#### Get All Appointments
```http
GET /wp-json/appointease/v1/debug/appointments
```

**Response:**
```json
{
  "total_count": 150,
  "all_appointments": [...],
  "status_counts": [...],
  "employee_counts": [...]
}
```

#### Clear All Appointments
```http
POST /wp-json/appointease/v1/clear-appointments
X-WP-Nonce: {nonce}
```

**Response:**
```json
{
  "success": true,
  "message": "All appointments cleared successfully"
}
```

---

### 10. Real-Time Slot Management

#### Select Slot (Lock)
```http
POST /wp-json/appointease/v1/slots/select
Content-Type: application/json

{
  "date": "2025-10-28",
  "time": "10:00",
  "employee_id": 2,
  "client_id": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "storage_mode": "redis",
  "redis_ops": {
    "get": 1,
    "set": 1,
    "publish": 1
  }
}
```

#### Deselect Slot (Unlock)
```http
POST /wp-json/appointease/v1/slots/deselect
Content-Type: application/json

{
  "date": "2025-10-28",
  "time": "10:00",
  "employee_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "storage_mode": "redis"
}
```

---

## WordPress Heartbeat API

### Overview
AppointEase uses WordPress Heartbeat API for real-time updates at 1-second intervals. This provides sub-second slot locking without WebSocket complexity.

### Configuration
- **Interval**: 1 second
- **Suspension**: Disabled on frontend
- **Transport**: WordPress AJAX (admin-ajax.php)

### Heartbeat Data Exchange

#### Client Sends (every 1 second)
```javascript
jQuery(document).on('heartbeat-send', function(e, data) {
  data.appointease_poll = {
    date: "2025-10-28",
    employee_id: 2,
    client_id: "abc123",        // Only if user selected
    selected_time: "10:00"      // Only if user selected
  };
});
```

#### Server Responds (every 1 second)
```javascript
jQuery(document).on('heartbeat-tick', function(e, data) {
  // data.appointease_active_selections
  // data.appointease_booked_slots
  // data.appointease_locked_slots
  // data.redis_ops
});
```

**Response Structure:**
```json
{
  "appointease_active_selections": [
    {
      "client_id": "abc123",
      "time": "10:00",
      "timestamp": 1730127045
    },
    {
      "client_id": "xyz789",
      "time": "10:30",
      "timestamp": 1730127050
    }
  ],
  "appointease_booked_slots": ["09:00", "09:30", "14:00"],
  "appointease_locked_slots": ["10:00", "10:30"],
  "redis_ops": {
    "get": 2,
    "set": 0,
    "publish": 0
  }
}
```

### React Hook Integration

**useHeartbeat.ts:**
```typescript
const { 
  isConnected,
  activeSelections,
  bookedSlots,
  lockedSlots,
  redisOps,
  selectSlot,
  deselectSlot 
} = useHeartbeat(pollData);
```

**useHeartbeatSlotPolling.ts:**
```typescript
const {
  activeSelections,
  bookedSlots,
  lockedSlots
} = useHeartbeatSlotPolling(
  date,
  employeeId,
  clientId,
  selectedTime
);
```

---

## Redis Integration

### Overview
Redis provides <1ms operations for slot locking with automatic MySQL fallback.

### Data Structure

#### 1. Active Selections (Temporary Locks)
```
Key:   appointease:selections:{date}:{employee_id}
Type:  SET
Value: {client_id}:{time}:{timestamp}
TTL:   300 seconds (5 minutes)

Example:
appointease:selections:2025-10-28:2
├─ "abc123:10:00:1730127045"
├─ "xyz789:10:30:1730127050"
└─ "def456:11:00:1730127055"
```

#### 2. Booked Slots (Permanent)
```
Key:   appointease:booked:{date}:{employee_id}
Type:  SET
Value: {time}
TTL:   86400 seconds (24 hours)

Example:
appointease:booked:2025-10-28:2
├─ "09:00"
├─ "09:30"
└─ "14:00"
```

#### 3. Pub/Sub Channel
```
Channel: appointease:slot_updates
Message: {"date": "2025-10-28", "employee_id": 2, "time": "10:00", "action": "select"}
```

### Redis Operations

| Operation | Command | Latency | Purpose |
|-----------|---------|---------|----------|
| Select Slot | SADD + EXPIRE | <1ms | Add to active selections |
| Deselect Slot | SREM | <1ms | Remove from active selections |
| Get Selections | SMEMBERS | <1ms | Retrieve all active selections |
| Book Slot | SADD + SREM | <1ms | Move to booked, remove from selections |
| Publish Event | PUBLISH | <5ms | Broadcast to all clients |

### MySQL Fallback

When Redis is unavailable:
- Automatic fallback to MySQL
- Uses `wp_appointease_temp_locks` table
- Cron job cleans expired locks
- Response includes `"storage_mode": "mysql"`

---

## Database Schema": "Consultation",
  "employee": "Dr. Smith",
  "date": "2025-10-28",
  "time": "09:00"
}
```

#### 8. Ping/Pong (Latency Check)
**Client → Server:**
```json
{
  "type": "ping",
  "timestamp": 1730127045000
}
```

**Server → Client:**
```json
{
  "type": "pong",
  "timestamp": 1730127045000,
  "latency": 15
}
```

#### 9. Get Debug Info
**Client → Server:**
```json
{
  "type": "get_debug"
}
```

**Server → Client:**
```json
{
  "type": "debug_info",
  "connectedClients": 4,
  "activeSelections": 1,
  "lockedSlots": 0,
  "clients": [...],
  "selections": [...],
  "locks": [...],
  "timestamp": 1730127045000
}
```

---

## Database Schema

### Tables

#### 1. wp_appointease_appointments
```sql
CREATE TABLE wp_appointease_appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  strong_id VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  appointment_date DATETIME NOT NULL,
  service_id INT,
  employee_id INT,
  status VARCHAR(50) DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_date (appointment_date),
  INDEX idx_employee (employee_id),
  INDEX idx_status (status)
);
```

#### 2. wp_appointease_services
```sql
CREATE TABLE wp_appointease_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INT DEFAULT 30,
  price DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. wp_appointease_staff
```sql
CREATE TABLE wp_appointease_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. wp_appointease_slot_locks
```sql
CREATE TABLE wp_appointease_slot_locks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  employee_id INT NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot (date, time, employee_id),
  INDEX idx_expires (expires_at),
  INDEX idx_employee (employee_id)
);
```

#### 5. wp_appointease_sessions
```sql
CREATE TABLE wp_appointease_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_email (email)
);
```

#### 6. wp_appointease_customers
```sql
CREATE TABLE wp_appointease_customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

#### 7. wp_appointease_blackout_dates
```sql
CREATE TABLE wp_appointease_blackout_dates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. wp_appointease_settings
```sql
CREATE TABLE wp_appointease_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## WordPress Hooks & Filters

### Actions

#### appointease_new_appointment
Triggered when a new appointment is created.
```php
add_action('appointease_new_appointment', function($webhook_data) {
    // $webhook_data contains appointment details
    error_log('New appointment: ' . $webhook_data['appointment_id']);
});
```

#### appointease_appointment_cancelled
Triggered when an appointment is cancelled.
```php
add_action('appointease_appointment_cancelled', function($appointment_id) {
    error_log('Appointment cancelled: ' . $appointment_id);
});
```

#### appointease_appointment_rescheduled
Triggered when an appointment is rescheduled.
```php
add_action('appointease_appointment_rescheduled', function($appointment_id, $old_date, $new_date) {
    error_log("Appointment {$appointment_id} moved from {$old_date} to {$new_date}");
}, 10, 3);
```

### Filters

#### appointease_booking_validation
Filter appointment data before validation.
```php
add_filter('appointease_booking_validation', function($booking_data) {
    // Modify or validate booking data
    return $booking_data;
});
```

#### appointease_email_template
Filter email template content.
```php
add_filter('appointease_email_template', function($template, $type) {
    // Modify email template
    return $template;
}, 10, 2);
```

---

## JavaScript Events

### Custom Events

#### appointease:booking:complete
```javascript
document.addEventListener('appointease:booking:complete', (event) => {
    console.log('Booking completed:', event.detail);
});
```

#### appointease:slot:locked
```javascript
document.addEventListener('appointease:slot:locked', (event) => {
    console.log('Slot locked:', event.detail);
});
```

#### appointease:conflict:detected
```javascript
document.addEventListener('appointease:conflict:detected', (event) => {
    console.log('Booking conflict:', event.detail);
});
```

---

## Configuration Options

### WordPress Options

#### appointease_options
Main plugin settings stored as serialized array:
```php
$options = get_option('appointease_options', [
    'working_days' => ['1','2','3','4','5'],
    'start_time' => '09:00',
    'end_time' => '17:00',
    'slot_duration' => 30,
    'advance_booking' => 30,
    'lunch_start' => '12:00',
    'lunch_end' => '14:00'
]);
```

#### Individual Options
- `appointease_working_days` - Array of working days (0=Sunday, 6=Saturday)
- `appointease_start_time` - Business start time (HH:MM)
- `appointease_end_time` - Business end time (HH:MM)
- `appointease_slot_duration` - Slot duration in minutes
- `appointease_advance_booking_days` - Max days in advance for booking
- `appointease_webhook_url` - External webhook URL for notifications

---

## Environment Variables

### WebSocket Server
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=blog_promoplus

# Server Configuration
WS_PORT=8080
WS_HOST=0.0.0.0
```

### WordPress Configuration
```php
// wp-config.php
define('APPOINTEASE_DEBUG', true);
define('APPOINTEASE_LOCK_DURATION', 600); // 10 minutes
define('APPOINTEASE_SESSION_DURATION', 86400); // 24 hours
```

---

## Rate Limiting

### API Rate Limits
- **OTP Generation**: 3 attempts per 10 minutes per email
- **Booking Creation**: 5 attempts per minute per IP
- **Session Creation**: 10 attempts per hour per email

### WebSocket Limits
- **Max Connections**: 1000 concurrent clients
- **Message Rate**: 100 messages per minute per client
- **Ping Interval**: 30 seconds

---

## Error Codes

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid session/token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (appointment/resource not found)
- `409` - Conflict (slot already booked)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Custom Error Codes
- `SLOT_LOCKED` - Slot is temporarily locked by another user
- `SLOT_TAKEN` - Slot is permanently booked
- `OTP_EXPIRED` - OTP code has expired
- `OTP_INVALID` - OTP code is incorrect
- `SESSION_EXPIRED` - User session has expired
- `PAST_DATE` - Cannot book appointments in the past
- `NON_WORKING_DAY` - Selected date is not a working day
- `BLACKOUT_DATE` - Selected date is blocked

---

## Security Features

### 1. Atomic Booking Operations
- Database transactions with row-level locking
- Prevents double-booking race conditions
- Microsecond precision timing

### 2. Slot Locking System
- 10-minute temporary locks during booking process
- Automatic cleanup of expired locks
- Real-time conflict detection

### 3. Session Management
- Secure token generation (32 characters)
- SHA-256 token hashing
- 24-hour session expiration
- Automatic cleanup of expired sessions

### 4. Input Validation
- Email validation
- Date format validation
- SQL injection prevention
- XSS protection

### 5. Rate Limiting
- OTP generation limits
- API request throttling
- WebSocket message rate limiting

---

## Performance Optimizations

### 1. Database Indexing
- Indexed columns: email, date, employee_id, status
- Composite indexes for common queries
- Automatic cleanup of old data

### 2. Caching
- WordPress object cache integration
- Transient API for temporary data
- Settings cache (1 hour TTL)

### 3. WebSocket Optimization
- Connection pooling
- Message batching
- Automatic reconnection
- Fallback to polling

### 4. Frontend Optimization
- React.memo for component optimization
- Callback memoization
- Lazy loading
- Code splitting

---

## Monitoring & Logging

### Debug Mode
Enable debug mode in WordPress:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

### Log Locations
- **WordPress**: `wp-content/debug.log`
- **WebSocket**: Console output
- **Database**: Query logs in debug mode

### Monitoring Endpoints
- **WebSocket Debug**: `http://localhost:8080/debug`
- **API Health**: `/wp-json/appointease/v1/health`

---

## Integration Examples

### 1. Custom Booking Form
```javascript
// Create appointment via API
fetch('/wp-json/appointease/v1/appointments', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': wpApiSettings.nonce
    },
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        date: '2025-10-28 10:00:00',
        service_id: 1,
        employee_id: 2
    })
})
.then(response => response.json())
.then(data => console.log('Booking created:', data));
```

### 2. Real-time Availability
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://blog.promoplus.com:8080?email=user@example.com');

ws.onopen = () => {
    // Check availability
    ws.send(JSON.stringify({
        type: 'check_availability',
        date: '2025-10-28',
        employeeId: 2
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'availability_update') {
        console.log('Unavailable slots:', data.unavailable);
    }
};
```

### 3. Webhook Integration
```php
// Configure webhook URL
update_option('appointease_webhook_url', 'https://your-site.com/webhook');

// Webhook will receive:
// POST https://your-site.com/webhook
// {
//   "event": "appointment.created",
//   "appointment_id": "APT-2025-000123",
//   "customer": {...},
//   "appointment": {...}
// }
```

---

## Support & Documentation

- **Plugin Directory**: `wp-content/plugins/wordpressBookingPlugin/`
- **Documentation**: `README.md`, `API-DOCUMENTATION.md`
- **WebSocket Docs**: `WEBSOCKET_SERVER.md`
- **Architecture**: See README.md for complete system architecture

---

**Version**: 1.0.0  
**Last Updated**: October 28, 2025  
**Author**: AppointEase Development Team
