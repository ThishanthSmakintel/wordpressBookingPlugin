# AppointEase WordPress Booking Plugin

## API Endpoints

### Base URLs
- **Primary**: `/wp-json/appointease/v1/`
- **Legacy**: `/wp-json/booking/v1/`

### Services

#### Get Services
```bash
GET /wp-json/booking/v1/services
```
**Response**: Array of services with id, name, description, duration, price

**Test**:
```bash
curl "http://blog.promoplus.com/wp-json/booking/v1/services"
```

### Staff

#### Get Staff
```bash
GET /wp-json/booking/v1/staff
```
**Response**: Array of staff with id, name, email, phone

**Test**:
```bash
curl "http://blog.promoplus.com/wp-json/booking/v1/staff"
```

### Availability

#### Check Date Availability
```bash
POST /wp-json/booking/v1/availability
Content-Type: application/json

{
  "date": "2025-10-06",
  "employee_id": 1
}
```

**Responses**:
- **Available**: `{"unavailable":[]}`
- **Weekend**: `{"unavailable":"all","reason":"non_working_day"}`
- **Past Date**: `{"unavailable":"all","reason":"past_date"}`
- **Too Far**: `{"unavailable":"all","reason":"too_far_advance"}`
- **Blackout**: `{"unavailable":"all","reason":"blackout_date"}`

**Tests**:
```bash
# Monday (Available)
curl -X POST "http://blog.promoplus.com/wp-json/booking/v1/availability" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-10-06","employee_id":1}'

# Saturday (Unavailable)
curl -X POST "http://blog.promoplus.com/wp-json/booking/v1/availability" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-10-04","employee_id":1}'

# Sunday (Unavailable)
curl -X POST "http://blog.promoplus.com/wp-json/booking/v1/availability" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-10-05","employee_id":1}'
```

### Appointments

#### Create Appointment
```bash
POST /wp-json/appointease/v1/appointments
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "date": "2025-10-06 10:00:00",
  "service_id": 1,
  "employee_id": 1
}
```

**Test**:
```bash
curl -X POST "http://blog.promoplus.com/wp-json/appointease/v1/appointments" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","date":"2025-10-06 10:00:00","service_id":1,"employee_id":1}'
```

#### Get Appointment
```bash
GET /wp-json/appointease/v1/appointments/{id}
```

**Test**:
```bash
curl "http://blog.promoplus.com/wp-json/appointease/v1/appointments/APT-2025-000001"
```

#### Cancel Appointment
```bash
DELETE /wp-json/appointease/v1/appointments/{id}
```

**Test**:
```bash
curl -X DELETE "http://blog.promoplus.com/wp-json/appointease/v1/appointments/APT-2025-000001"
```

#### Reschedule Appointment
```bash
PUT /wp-json/appointease/v1/appointments/{id}
Content-Type: application/json

{
  "new_date": "2025-10-07 14:00:00"
}
```

**Test**:
```bash
curl -X PUT "http://blog.promoplus.com/wp-json/appointease/v1/appointments/APT-2025-000001" \
  -H "Content-Type: application/json" \
  -d '{"new_date":"2025-10-07 14:00:00"}'
```

### User Appointments

#### Get User Appointments
```bash
POST /wp-json/appointease/v1/user-appointments
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Test**:
```bash
curl -X POST "http://blog.promoplus.com/wp-json/appointease/v1/user-appointments" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Authentication

#### Verify OTP
```bash
POST /wp-json/appointease/v1/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Test**:
```bash
curl -X POST "http://blog.promoplus.com/wp-json/appointease/v1/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### Session Management

#### Create Session
```bash
POST /wp-json/appointease/v1/session
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Get Session
```bash
GET /wp-json/appointease/v1/session
```

#### Delete Session
```bash
DELETE /wp-json/appointease/v1/session
```

### Debug Endpoints

#### Debug Appointments (Admin Only)
```bash
GET /wp-json/appointease/v1/debug/appointments
```

#### Clear All Appointments
```bash
POST /wp-json/appointease/v1/clear-appointments
```

#### Fix Appointments
```bash
POST /wp-json/appointease/v1/fix-appointments
```

## Business Logic

### Working Days
- Default: Monday-Friday (1,2,3,4,5)
- Saturday=6, Sunday=0 are non-working days
- Configurable in WordPress admin settings

### Date Validation
1. **Past Date Check**: Dates before today are unavailable
2. **Advance Booking**: Max 30 days in advance (configurable)
3. **Working Days**: Only configured working days are available
4. **Blackout Dates**: Admin-defined unavailable date ranges

### Time Slots
- Default: 30-minute slots from 9:00 AM to 5:00 PM
- Configurable in admin settings
- Existing appointments block time slots

## Error Codes

- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid session)
- `403`: Forbidden (admin access required)
- `404`: Not Found (appointment/resource not found)
- `500`: Internal Server Error (database/system error)

## Testing Suite

Run all endpoint tests:
```bash
# Test availability for different scenarios
curl -X POST "http://blog.promoplus.com/wp-json/booking/v1/availability" -H "Content-Type: application/json" -d '{"date":"2025-10-06","employee_id":1}' # Monday
curl -X POST "http://blog.promoplus.com/wp-json/booking/v1/availability" -H "Content-Type: application/json" -d '{"date":"2025-10-04","employee_id":1}' # Saturday
curl -X POST "http://blog.promoplus.com/wp-json/booking/v1/availability" -H "Content-Type: application/json" -d '{"date":"2025-12-01","employee_id":1}' # Too far

# Test services and staff
curl "http://blog.promoplus.com/wp-json/booking/v1/services"
curl "http://blog.promoplus.com/wp-json/booking/v1/staff"
```