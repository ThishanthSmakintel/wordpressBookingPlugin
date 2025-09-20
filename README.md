# AppointEase WordPress Booking Plugin

## Complete Architecture Overview

### System Architecture

AppointEase is a modern WordPress booking plugin built with a **modular React frontend** and **PHP REST API backend**. The system handles appointment booking, management, and user authentication through a clean, scalable architecture.

## Frontend Architecture (React + TypeScript)

### Entry Point Flow
```
WordPress Block → React Mount → Modular App
     ↓              ↓            ↓
  PHP Render → DOM Container → BookingApp
```

### 1. WordPress Integration
```php
// Block registration in class-booking-plugin.php
register_block_type('appointease/booking-form', [
    'render_callback' => 'render_booking_block'
]);

// Frontend script enqueuing
wp_enqueue_script('booking-frontend', 
    BOOKING_PLUGIN_URL . 'build/frontend.js'
);
```

### 2. Build Process
```javascript
// webpack.config.js
entry: {
    frontend: path.resolve('src', 'app', 'index.ts')
}
// Outputs: build/frontend.js + build/frontend.css
```

### 3. React Application Structure

#### Main Entry (`src/app/index.ts`)
```typescript
export { BookingApp } from './core/BookingApp';
```

#### Core Application (`src/app/core/BookingApp.tsx`)
- **62 useState hooks** for comprehensive state management
- **7-step booking flow** with form validation
- **Authentication system** with OTP verification
- **Real-time updates** via polling and WebSocket-like behavior
- **Debug panel** for development

#### Feature Modules (`src/app/features/`)
```
features/
├── booking/          # 7-step booking process
│   ├── components/   # Step components, forms
│   ├── hooks/        # Booking-specific hooks
│   └── services/     # Booking API calls
├── appointments/     # Appointment management
│   ├── components/   # List, card, actions
│   └── hooks/        # Appointment state
├── authentication/   # Login, OTP, sessions
│   ├── components/   # Login forms, OTP input
│   └── hooks/        # Auth state management
└── debug/           # Development tools
    ├── components/   # Debug panels, logs
    └── hooks/        # Debug state
```

#### Shared Resources (`src/app/shared/`)
```
shared/
├── components/      # Reusable UI components
│   ├── forms/       # Input, button, validation
│   ├── layout/      # Header, footer, containers
│   └── ui/          # Primitives, modals, alerts
├── hooks/           # Common React hooks
├── services/        # API client, utilities
├── store/           # Global state management
├── types/           # TypeScript definitions
├── constants/       # App-wide constants
└── utils/           # Helper functions
```

### 4. State Management Architecture

#### Hook-Based State (62 useState hooks)
```typescript
// Main state categories in BookingApp.tsx
const [currentStep, setCurrentStep] = useState(1);           // UI Flow
const [selectedService, setSelectedService] = useState(null); // Form Data
const [appointments, setAppointments] = useState([]);        // Data State
const [isLoggedIn, setIsLoggedIn] = useState(false);        // Auth State
const [debugMode, setDebugMode] = useState(false);          // Debug State
// ... 57 more hooks for comprehensive state management
```

#### Custom Hooks Pattern
```typescript
// Example: useBookingState.hook.ts
export const useBookingState = () => {
    const [state, setState] = useState(initialState);
    
    const actions = {
        nextStep: () => setState(prev => ({ ...prev, step: prev.step + 1 })),
        setService: (service) => setState(prev => ({ ...prev, selectedService: service }))
    };
    
    return { state, actions };
};
```

## Backend Architecture (PHP + MySQL)

### 1. Plugin Structure
```
wordpressBookingPlugin/
├── booking-plugin.php           # Main plugin file
├── includes/                    # Core PHP classes
│   ├── class-booking-plugin.php # Main plugin class
│   ├── class-api-endpoints.php  # REST API routes
│   ├── class-activator.php      # Plugin activation
│   ├── class-settings.php       # Admin settings
│   └── session-manager.php      # Session handling
├── admin/                       # WordPress admin interface
└── build/                       # Compiled frontend assets
```

### 2. Database Schema
```sql
-- Core tables
wp_appointease_appointments     # Main appointments
wp_appointease_services        # Available services
wp_appointease_staff           # Staff members
wp_appointease_settings        # Plugin configuration
wp_appointease_sessions        # User sessions
wp_appointease_email_templates # Email templates
```

### 3. REST API Architecture

#### API Namespaces
- **Primary**: `/wp-json/appointease/v1/` (new endpoints)
- **Legacy**: `/wp-json/booking/v1/` (backward compatibility)

#### Endpoint Categories
```php
// Appointment Management
POST   /appointments              # Create appointment
GET    /appointments/{id}         # Get appointment
PUT    /appointments/{id}         # Reschedule appointment
DELETE /appointments/{id}         # Cancel appointment

// Data Retrieval
GET    /services                  # Get available services
GET    /staff                     # Get staff members
POST   /availability              # Check date availability

// User Management
POST   /user-appointments         # Get user's appointments
POST   /verify-otp               # Verify OTP code
POST   /session                  # Create session
GET    /session                  # Get session
DELETE /session                  # Delete session

// System Utilities
GET    /server-date              # Get server time
GET    /business-hours           # Get business hours
POST   /check-slot               # Check slot availability
```

## Complete Request Flow

### 1. User Booking Flow
```
User Action → React Component → API Service → PHP Endpoint → Database
     ↓              ↓              ↓            ↓            ↓
"Book Apt" → BookingForm → bookingService → create_appointment → MySQL
     ↓              ↓              ↓            ↓            ↓
  Success ← UI Update ← Response ← JSON Response ← Insert Result
```

### 2. Authentication Flow
```
Email Input → OTP Generation → Email Sent → OTP Verification → Session Creation
     ↓              ↓              ↓            ↓               ↓
  LoginForm → generate_otp → wp_mail → verify_otp → create_session
     ↓              ↓              ↓            ↓               ↓
  OTP Form ← UI Update ← Success ← Validation ← Session Token
```

### 3. Real-time Updates
```
Component Mount → Start Polling → API Calls → State Updates → UI Refresh
      ↓              ↓             ↓           ↓            ↓
  useEffect → setInterval → fetch() → setState → re-render
      ↓              ↓             ↓           ↓            ↓
  Cleanup ← clearInterval ← unmount ← cleanup ← component
```

## Key Features Implementation

### 1. 7-Step Booking Process
```typescript
// Step flow in BookingApp.tsx
const steps = [
    { id: 1, name: 'Service Selection', component: ServiceSelector },
    { id: 2, name: 'Staff Selection', component: StaffSelector },
    { id: 3, name: 'Date Selection', component: DateSelector },
    { id: 4, name: 'Time Selection', component: TimeSelector },
    { id: 5, name: 'Customer Info', component: CustomerForm },
    { id: 6, name: 'Review', component: ReviewStep },
    { id: 7, name: 'Confirmation', component: ConfirmationStep }
];
```

### 2. Availability Checking
```php
// PHP availability logic
public function check_availability($request) {
    $date = $request['date'];
    $employee_id = $request['employee_id'];
    
    // Check working days
    if (!$this->is_working_day($date)) {
        return ['unavailable' => 'all', 'reason' => 'non_working_day'];
    }
    
    // Check existing appointments
    $booked_slots = $this->get_booked_slots($date, $employee_id);
    
    return ['unavailable' => $booked_slots];
}
```

### 3. Session Management
```php
// Secure session handling
class Session_Manager {
    public function create_session($email) {
        $token = wp_generate_password(32, false);
        $expires = time() + (24 * 60 * 60); // 24 hours
        
        return $this->store_session($email, $token, $expires);
    }
}
```

## Development Workflow

### 1. Local Development
```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build
```

### 2. File Structure Benefits
- **Modular**: Features isolated in separate directories
- **Scalable**: Easy to add new features without conflicts
- **Maintainable**: Clear separation of concerns
- **Testable**: Components and hooks can be tested independently

### 3. Performance Optimizations
- **Code splitting**: Features can be lazy-loaded
- **Tree shaking**: Unused code eliminated in build
- **CSS optimization**: Styles bundled and minified
- **API caching**: Responses cached for better performance

## Deployment Architecture

### 1. WordPress Integration
```php
// Plugin activation creates necessary tables
register_activation_hook(__FILE__, ['Booking_Activator', 'activate']);

// Block registration for Gutenberg
register_block_type('appointease/booking-form');

// REST API routes registration
add_action('rest_api_init', [$this, 'register_routes']);
```

### 2. Asset Management
```php
// Enqueue compiled assets
wp_enqueue_script('booking-frontend', 
    BOOKING_PLUGIN_URL . 'build/frontend.js',
    ['wp-element'], // React dependency
    PLUGIN_VERSION
);
```

### 3. Security Measures
- **Nonce verification** for all API calls
- **Input sanitization** on all user data
- **Permission checks** for admin functions
- **Session token validation** for authenticated actions

## API Endpoints Reference

### Services & Staff
```bash
GET /wp-json/booking/v1/services     # Get available services
GET /wp-json/booking/v1/staff        # Get staff members
```

### Availability Checking
```bash
POST /wp-json/booking/v1/availability
{
  "date": "2025-10-06",
  "employee_id": 1
}
```

### Appointment Management
```bash
# Create appointment
POST /wp-json/appointease/v1/appointments
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "date": "2025-10-06 10:00:00",
  "service_id": 1,
  "employee_id": 1
}

# Get appointment
GET /wp-json/appointease/v1/appointments/{id}

# Reschedule appointment
PUT /wp-json/appointease/v1/appointments/{id}
{"new_date": "2025-10-07 14:00:00"}

# Cancel appointment
DELETE /wp-json/appointease/v1/appointments/{id}
```

### User Management
```bash
# Get user appointments
POST /wp-json/appointease/v1/user-appointments
{"email": "user@example.com"}

# Verify OTP
POST /wp-json/appointease/v1/verify-otp
{"email": "user@example.com", "otp": "123456"}
```

## Business Logic

### Working Days Configuration
- Default: Monday-Friday (1,2,3,4,5)
- Configurable via WordPress admin
- Weekend blocking automatic

### Time Slot Management
- 30-minute default intervals
- 9:00 AM - 5:00 PM default hours
- Existing appointments block slots
- Buffer time between appointments

### Validation Rules
1. **Past dates** automatically blocked
2. **Advance booking** limited (30 days default)
3. **Working hours** enforced
4. **Blackout dates** supported
5. **Double booking** prevention

This architecture provides a robust, scalable appointment booking system with modern React frontend and secure PHP backend, fully integrated with WordPress ecosystem.