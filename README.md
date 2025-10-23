# AppointEase WordPress Booking Plugin

## Complete Architecture Overview

### System Architecture

AppointEase is a modern WordPress booking plugin built with a **modular React frontend** and **PHP REST API backend**. The system handles appointment booking, management, and user authentication through a clean, scalable architecture.

## Current File Structure

```
wordpressBookingPlugin/
├── booking-plugin.php           # Main plugin entry point
├── includes/                    # Core PHP backend classes
│   ├── class-booking-plugin.php # Main plugin orchestrator
│   ├── class-api-endpoints.php  # REST API route definitions
│   ├── class-activator.php      # Plugin activation handler
│   ├── class-deactivator.php    # Plugin deactivation handler
│   ├── class-settings.php       # WordPress admin settings
│   ├── class-db-seeder.php      # Database seeding utilities
│   ├── class-db-reset.php       # Database reset functionality
│   ├── class-heartbeat-handler.php # Real-time updates
│   └── session-manager.php      # User session management
├── admin/                       # WordPress admin interface
│   ├── appointease-admin.php    # Admin dashboard
│   ├── appointease-admin.css    # Admin styling
│   ├── appointease-admin.js     # Admin JavaScript
│   └── db-reset-admin.php       # Database management UI
├── src/                         # Frontend React application
│   ├── app/                     # New modular architecture
│   │   ├── index.ts             # Main app export
│   │   ├── core/
│   │   │   └── BookingApp.tsx   # Core application component
│   │   ├── features/            # Feature-based modules
│   │   │   ├── booking/         # 7-step booking process
│   │   │   │   ├── components/  # Booking step components
│   │   │   │   ├── hooks/       # Booking-specific hooks
│   │   │   │   └── services/    # Booking API services
│   │   │   ├── appointments/    # Appointment management
│   │   │   │   ├── components/  # Dashboard, manager components
│   │   │   │   └── hooks/       # Appointment state hooks
│   │   │   ├── authentication/  # Login & OTP system
│   │   │   │   ├── components/  # Login forms, verification
│   │   │   │   └── hooks/       # Auth state management
│   │   │   └── debug/          # Development tools
│   │   │       ├── components/ # Debug panels, logs
│   │   │       └── hooks/      # Debug state hooks
│   │   └── shared/             # Reusable resources
│   │       ├── components/     # UI components library
│   │       │   ├── forms/      # Form components
│   │       │   ├── layout/     # Layout components
│   │       │   └── ui/         # Base UI primitives
│   │       ├── hooks/          # Common React hooks
│   │       ├── services/       # API client utilities
│   │       ├── store/          # WordPress data store
│   │       ├── types/          # TypeScript definitions
│   │       ├── constants/      # App-wide constants
│   │       └── utils/          # Helper functions
│   ├── components/             # Legacy component structure
│   │   ├── forms/              # Form components
│   │   ├── pages/              # Page components
│   │   └── ui/                 # UI components
│   ├── hooks/                  # Custom React hooks
│   ├── modules/                # Feature modules
│   ├── services/               # API services
│   ├── store/                  # WordPress data store
│   ├── types/                  # Type definitions
│   ├── utils/                  # Utility functions
│   └── assets/                 # Styles and static assets
│       └── styles/             # CSS organization
│           ├── components/     # Component-specific styles
│           ├── frontend/       # Frontend application styles
│           └── editor/         # WordPress editor styles
├── blocks/                     # WordPress Gutenberg blocks
├── build/                      # Compiled assets (webpack output)
├── languages/                  # Internationalization files
└── webpack.config.js           # Build configuration
```

## Frontend Architecture (React + TypeScript)

### Entry Point Flow
```
WordPress Block → React Mount → Modular App
     ↓              ↓            ↓
  PHP Render → DOM Container → BookingApp
     ↓              ↓            ↓
booking-plugin.php → webpack build → src/app/index.ts
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
- **WordPress `@wordpress/data` store** with selectors and actions
- **Session management** with persistent login and OTP verification
- **Reschedule & cancellation** functionality with proper state handling
- **7-step booking flow** with form validation
- **Authentication system** with OTP verification
- **Real-time updates** via WebSocket with automatic polling fallback
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

#### WordPress Data Store System
The application uses **WordPress `@wordpress/data`** for state management following WordPress development best practices:

#### A. WordPress Data Store (Primary State)
```typescript
// src/store/wordpress-store.ts - WordPress data store
const DEFAULT_STATE = {
    step: 1,
    selectedService: null,
    selectedEmployee: null,
    selectedDate: '',
    selectedTime: '',
    formData: { firstName: '', lastName: '', email: '', phone: '' },
    services: [],
    employees: [],
    appointments: [],
    servicesLoading: false,
    employeesLoading: false,
    appointmentsLoading: false,
    isSubmitting: false,
    isOnline: true,
    errors: {},
    serverDate: null,
    unavailableSlots: [],
    bookingDetails: {}
};

// WordPress store registration
register(createReduxStore('appointease/booking', {
    reducer,
    actions,
    selectors,
    controls
}));
```

#### B. WordPress Data Hook
```typescript
// src/hooks/useAppointmentStore.ts - WordPress data integration
export const useAppointmentStore = () => {
    const state = useSelect((select: any) => {
        const store = select('appointease/booking');
        return {
            step: store.getStep?.() ?? 1,
            selectedService: store.getSelectedService?.() ?? null,
            selectedEmployee: store.getSelectedEmployee?.() ?? null,
            selectedDate: store.getSelectedDate?.() ?? '',
            selectedTime: store.getSelectedTime?.() ?? '',
            formData: store.getFormData?.() ?? { firstName: '', lastName: '', email: '', phone: '' },
            services: store.getServices?.() ?? [],
            employees: store.getEmployees?.() ?? [],
            appointments: store.getAppointments?.() ?? [],
            // ... other selectors
        };
    }, []);

    const dispatch = useDispatch('appointease/booking');

    return {
        ...state,
        setStep: useCallback((step: number) => dispatch?.setStep?.(step), [dispatch]),
        setSelectedService: useCallback((service: any) => dispatch?.setSelectedService?.(service), [dispatch]),
        setFormData: useCallback((data: Record<string, any>) => dispatch?.setFormData?.(data), [dispatch]),
        // ... other actions
    };
};
```

#### C. Custom Hooks for UI State
```typescript
// src/hooks/useBookingState.ts - UI-specific state
export const useBookingState = () => {
    // Authentication flow
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    
    // Appointment management
    const [manageMode, setManageMode] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    
    return { /* all state and setters */ };
};
```

#### D. Debug State Hook
```typescript
// src/hooks/useDebugState.ts - Development tools
export const useDebugState = () => {
    const [debugMode, setDebugMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeSynced, setTimeSynced] = useState(false);
    const [allBookings, setAllBookings] = useState([]);
    const [debugServices, setDebugServices] = useState([]);
    const [debugStaff, setDebugStaff] = useState([]);
    const [workingDays, setWorkingDays] = useState([]);
    const [debugTimeSlots, setDebugTimeSlots] = useState([]);
    const [availabilityData, setAvailabilityData] = useState(null);
    
    return { /* debug state and actions */ };
};
```

#### E. Actions Hook
```typescript
// src/hooks/useBookingActions.ts - Business logic
export const useBookingActions = (bookingState) => {
    const store = useBookingStore();
    
    const checkAvailability = useCallback(async (date, employeeId) => {
        // API call to check slot availability
        const response = await fetch('/wp-json/booking/v1/availability', {
            method: 'POST',
            body: JSON.stringify({ date, employee_id: employeeId })
        });
        const data = await response.json();
        bookingState.setUnavailableSlots(data.unavailable || []);
    }, []);
    
    const handleSubmit = useCallback(async () => {
        store.setIsSubmitting(true);
        // Booking submission logic
    }, []);
    
    return { checkAvailability, handleSubmit, loadUserAppointmentsRealtime };
};
```

#### State Flow Pattern
```
User Action → Component Event → Hook Action → WordPress Store → UI Re-render
     ↓              ↓              ↓               ↓              ↓
"Next Step" → onClick handler → setStep(2) → WordPress dispatch → New step UI
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

### 3. Real-time Updates (WebSocket + Polling Hybrid)
```
Component Mount → WebSocket Connect → Real-time Updates → State Updates → UI Refresh
      ↓                   ↓                  ↓               ↓            ↓
  useRealtime → Try WebSocket → Success → onUpdate → setState → re-render
      ↓                   ↓                  ↓               ↓            ↓
  Fallback ← Connection Failed ← Polling → fetch() → setState → re-render
      ↓                   ↓                  ↓               ↓            ↓
  Cleanup ← Disconnect ← unmount ← cleanup ← component
```

## Application Lifecycle & Component Flow

### 1. Application Initialization
```typescript
// src/app/core/BookingApp.tsx initialization flow
1. WordPress loads plugin → booking-plugin.php
2. Plugin registers Gutenberg block → class-booking-plugin.php
3. Block renders container → render_booking_block()
4. Webpack bundle loads → build/frontend.js
5. React app mounts → initBookingApp('appointease-booking')
6. BookingApp component renders → src/app/core/BookingApp.tsx
7. WordPress data store initializes → useAppointmentStore()
8. Custom hooks initialize → useBookingState(), useDebugState()
9. Session check → checkExistingSession() for persistent login
10. Initial data loads → loadInitialData() useEffect
11. UI renders based on step state and authentication status
```

### 2. Component Architecture
```
BookingApp (Core)
├── BookingHeader (Live time, login/logout)
├── ConnectionStatus (Online/offline indicator)
├── StepProgress (1-6 step indicator)
├── Conditional Rendering:
│   ├── LoginForm (Authentication flow)
│   ├── Dashboard (User appointments)
│   ├── AppointmentManager (Reschedule/cancel)
│   └── Booking Steps (1-9):
│       ├── Step 1: ServiceSelector
│       ├── Step 2: EmployeeSelector  
│       ├── Step 3: DateSelector
│       ├── Step 4: TimeSelector
│       ├── Step 5: CustomerInfoForm / EmailVerification
│       ├── Step 6: Review & Confirm
│       ├── Step 7: BookingSuccessPage
│       ├── Step 8: Cancellation Success
│       └── Step 9: Reschedule Success
└── DebugPanel (Development tools)
```

### 3. 7-Step Booking Process Flow
```typescript
// Complete booking flow with state transitions
Step 1: Service Selection
  → User selects service → setSelectedService() → setStep(2)
  
 Step 2: Staff Selection  
  → User selects employee → setSelectedEmployee() → setStep(3)
  
 Step 3: Date Selection
  → User picks date → setSelectedDate() → setStep(4)
  
 Step 4: Time Selection
  → Availability check → checkAvailability(date, employeeId)
  → User selects time → setSelectedTime() → setStep(5)
  
 Step 5: Customer Information
  → If not logged in: CustomerInfoForm → Email verification
  → If logged in: Skip to step 6
  → If rescheduling: Show reschedule summary
  
 Step 6: Review & Confirm
  → Display booking summary → User confirms → handleSubmit()
  → API call to create appointment → setStep(7)
  
 Step 7: Success Confirmation
  → Show appointment ID → Email confirmation sent
  → Options: Book another, View dashboard
```

### 4. Authentication Flow
```typescript
// Multi-step authentication process
1. User clicks "Login" → setShowLogin(true)
2. LoginForm renders → Email input
3. User enters email → setLoginEmail(email)
4. Click "Send OTP" → setIsLoadingOTP(true)
5. OTP generation → API call to generate_otp
6. Email sent → setOtpSent(true)
7. OTP input form → setOtpCode(code)
8. Verify OTP → API call to verify_otp
9. Success → setIsLoggedIn(true) → setShowDashboard(true)
10. Load user appointments → loadUserAppointmentsRealtime()
```

### 5. Real-time Features
```typescript
// Multiple real-time update mechanisms

// 1. Time synchronization (every second)
useEffect(() => {
    const timer = setInterval(() => 
        debugState.setCurrentTime(new Date()), 1000
    );
    return () => clearInterval(timer);
}, []);

// 2. Appointment polling (every 10 seconds when logged in)
useEffect(() => {
    if (!bookingState.isLoggedIn || !bookingState.showDashboard) return;
    const interval = setInterval(() => 
        loadUserAppointmentsRealtime(), 10000
    );
    return () => clearInterval(interval);
}, [bookingState.isLoggedIn, bookingState.showDashboard]);

// 3. Debug data polling (every 2 seconds)
useEffect(() => {
    const fetchAllData = async () => { /* debug data fetching */ };
    fetchAllData();
    const interval = setInterval(fetchAllData, 2000);
    return () => clearInterval(interval);
}, [selectedEmployee, selectedDate]);

// 4. Online/offline detection
useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}, []);
```

## Key Features Implementation

### 2. Availability Checking System
```typescript
// Frontend availability check (React)
const checkAvailability = useCallback(async (date, employeeId) => {
    try {
        const response = await fetch(`${window.bookingAPI.root}booking/v1/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, employee_id: employeeId })
        });
        const data = await response.json();
        bookingState.setUnavailableSlots(data.unavailable || []);
    } catch (error) {
        console.error('Availability check failed:', error);
    }
}, []);

// Triggered automatically when date/employee changes
useEffect(() => {
    if (step === 4 && selectedDate && selectedEmployee) {
        checkAvailability(selectedDate, selectedEmployee.id);
    }
}, [step, selectedDate, selectedEmployee]);
```

```php
// Backend availability logic (PHP)
public function check_availability($request) {
    $date = $request['date'];
    $employee_id = $request['employee_id'];
    
    // Check working days (Monday-Friday: 1,2,3,4,5)
    $working_days = get_option('appointease_working_days', [1,2,3,4,5]);
    $day_of_week = date('N', strtotime($date));
    
    if (!in_array($day_of_week, $working_days)) {
        return ['unavailable' => 'all', 'reason' => 'non_working_day'];
    }
    
    // Check existing appointments
    global $wpdb;
    $booked_slots = $wpdb->get_col($wpdb->prepare(
        "SELECT TIME(appointment_date) FROM {$wpdb->prefix}appointease_appointments 
         WHERE DATE(appointment_date) = %s AND employee_id = %d AND status != 'cancelled'",
        $date, $employee_id
    ));
    
    return ['unavailable' => $booked_slots];
}
```

### 3. Session Management & Security
```php
// includes/session-manager.php - Secure session handling
class Session_Manager {
    public function create_session($email) {
        global $wpdb;
        
        // Generate secure token
        $token = wp_generate_password(32, false);
        $expires = time() + (24 * 60 * 60); // 24 hours
        
        // Store in database
        $result = $wpdb->insert(
            $wpdb->prefix . 'appointease_sessions',
            [
                'email' => sanitize_email($email),
                'token' => hash('sha256', $token),
                'expires' => $expires,
                'created_at' => current_time('mysql')
            ],
            ['%s', '%s', '%d', '%s']
        );
        
        return $result ? $token : false;
    }
    
    public function validate_session($token) {
        global $wpdb;
        
        $session = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}appointease_sessions 
             WHERE token = %s AND expires > %d",
            hash('sha256', $token), time()
        ));
        
        return $session ? $session->email : false;
    }
    
    public function destroy_session($token) {
        global $wpdb;
        
        return $wpdb->delete(
            $wpdb->prefix . 'appointease_sessions',
            ['token' => hash('sha256', $token)],
            ['%s']
        );
    }
}
```

### 4. OTP System Implementation
```php
// Multi-step OTP verification with rate limiting
public function generate_otp($email) {
    // Rate limiting check
    $recent_attempts = $this->get_recent_otp_attempts($email);
    if ($recent_attempts >= 3) {
        return new WP_Error('rate_limit', 'Too many attempts. Please wait.');
    }
    
    // Generate 6-digit OTP
    $otp = sprintf('%06d', mt_rand(0, 999999));
    $expires = time() + (10 * 60); // 10 minutes
    
    // Store OTP
    global $wpdb;
    $wpdb->insert(
        $wpdb->prefix . 'appointease_otps',
        [
            'email' => sanitize_email($email),
            'otp' => hash('sha256', $otp),
            'expires' => $expires,
            'attempts' => 0
        ],
        ['%s', '%s', '%d', '%d']
    );
    
    // Send email
    $this->send_otp_email($email, $otp);
    
    return ['success' => true, 'expires' => $expires];
}

public function verify_otp($email, $otp) {
    global $wpdb;
    
    $stored_otp = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}appointease_otps 
         WHERE email = %s AND expires > %d ORDER BY id DESC LIMIT 1",
        $email, time()
    ));
    
    if (!$stored_otp) {
        return new WP_Error('expired', 'OTP expired or not found');
    }
    
    // Check attempts
    if ($stored_otp->attempts >= 3) {
        return new WP_Error('max_attempts', 'Maximum attempts exceeded');
    }
    
    // Verify OTP
    if (hash('sha256', $otp) !== $stored_otp->otp) {
        // Increment attempts
        $wpdb->update(
            $wpdb->prefix . 'appointease_otps',
            ['attempts' => $stored_otp->attempts + 1],
            ['id' => $stored_otp->id],
            ['%d'], ['%d']
        );
        return new WP_Error('invalid', 'Invalid OTP');
    }
    
    // Success - clean up OTP
    $wpdb->delete(
        $wpdb->prefix . 'appointease_otps',
        ['id' => $stored_otp->id],
        ['%d']
    );
    
    return ['success' => true];
}
```

### 5. Performance Optimizations
```typescript
// React.memo for component optimization
const BookingApp = React.memo(React.forwardRef<any, any>((props, ref) => {
    // Component logic
}));

const ServiceSelector = React.memo(() => {
    // Service selection logic
});

// Callback optimization
const calculateCardsPerPage = useCallback(() => {
    if (!dashboardRef.current) return 2;
    const container = dashboardRef.current;
    const containerWidth = container.clientWidth;
    // Dynamic calculation based on screen size
    return Math.max(1, Math.min(totalCards, 12));
}, []);

// Debounced API calls
const loadInitialData = useCallback(async () => {
    if (!window.bookingAPI && !isOnline) return;
    
    try {
        setServicesLoading(true);
        const [servicesResponse, staffResponse] = await Promise.all([
            fetch(`${window.bookingAPI.root}booking/v1/services`),
            fetch(`${window.bookingAPI.root}booking/v1/staff`)
        ]);
        // Process responses
    } catch (error) {
        // Error handling
    }
}, [isOnline, bookingState.retryCount]);
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

## Complete API Documentation

### Core Endpoints

#### Services & Staff Management
```bash
# Get all available services
GET /wp-json/booking/v1/services
Response: [
  {
    "id": 1,
    "name": "Consultation",
    "duration": 30,
    "price": 50.00,
    "description": "Initial consultation"
  }
]

# Get all staff members
GET /wp-json/booking/v1/staff  
Response: [
  {
    "id": 1,
    "name": "Dr. Smith",
    "email": "smith@clinic.com",
    "specialization": "General Practice",
    "working_hours": "09:00-17:00"
  }
]
```

#### Availability System
```bash
# Check date availability
POST /wp-json/booking/v1/availability
Headers: { "Content-Type": "application/json" }
Body: {
  "date": "2025-01-15",
  "employee_id": 1
}

Response: {
  "unavailable": ["09:00", "10:30", "14:00"],
  "working_day": true,
  "business_hours": {
    "start": "09:00",
    "end": "17:00"
  }
}

# Get business hours
GET /wp-json/appointease/v1/business-hours
Response: {
  "monday": {"start": "09:00", "end": "17:00"},
  "tuesday": {"start": "09:00", "end": "17:00"},
  "working_days": [1,2,3,4,5]
}
```

#### Appointment Management
```bash
# Create new appointment
POST /wp-json/appointease/v1/appointments
Headers: { 
  "Content-Type": "application/json",
  "X-WP-Nonce": "nonce_value"
}
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "appointment_date": "2025-01-15 10:00:00",
  "service_id": 1,
  "employee_id": 1,
  "notes": "First visit"
}

Response: {
  "success": true,
  "appointment_id": 12345,
  "message": "Appointment booked successfully",
  "confirmation_sent": true
}

# Get appointment details
GET /wp-json/appointease/v1/appointments/12345
Response: {
  "id": 12345,
  "name": "John Doe",
  "email": "john@example.com",
  "appointment_date": "2025-01-15 10:00:00",
  "service_name": "Consultation",
  "staff_name": "Dr. Smith",
  "status": "confirmed",
  "created_at": "2025-01-10 14:30:00"
}

# Reschedule appointment
PUT /wp-json/appointease/v1/appointments/12345
Body: {
  "new_date": "2025-01-16 14:00:00",
  "reason": "Schedule conflict"
}

Response: {
  "success": true,
  "message": "Appointment rescheduled successfully",
  "new_date": "2025-01-16 14:00:00"
}

# Cancel appointment
DELETE /wp-json/appointease/v1/appointments/12345
Body: {
  "reason": "No longer needed"
}

Response: {
  "success": true,
  "message": "Appointment cancelled successfully",
  "refund_processed": false
}
```

#### User Management & Authentication
```bash
# Get user's appointments
POST /wp-json/appointease/v1/user-appointments
Body: {
  "email": "user@example.com"
}

Response: {
  "appointments": [
    {
      "id": 12345,
      "date": "2025-01-15 10:00:00",
      "service": "Consultation",
      "staff": "Dr. Smith",
      "status": "confirmed"
    }
  ],
  "total": 1
}

# Generate OTP for authentication
POST /wp-json/appointease/v1/generate-otp
Body: {
  "email": "user@example.com",
  "purpose": "login"
}

Response: {
  "success": true,
  "message": "OTP sent to email",
  "expires_in": 600,
  "can_resend_in": 60
}

# Verify OTP
POST /wp-json/appointease/v1/verify-otp
Body: {
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "login"
}

Response: {
  "success": true,
  "session_token": "abc123...",
  "expires_in": 86400
}

# Create/manage session
POST /wp-json/appointease/v1/session
Body: {
  "email": "user@example.com"
}

GET /wp-json/appointease/v1/session
Headers: { "Authorization": "Bearer session_token" }

DELETE /wp-json/appointease/v1/session
Headers: { "Authorization": "Bearer session_token" }
```

#### System Utilities
```bash
# Get server date/time
GET /wp-json/appointease/v1/server-date
Response: {
  "server_date": "2025-01-10 15:30:45",
  "timezone": "America/New_York",
  "timestamp": 1736527845
}

# Check specific time slot
POST /wp-json/appointease/v1/check-slot
Body: {
  "date": "2025-01-15",
  "time": "10:00",
  "employee_id": 1,
  "service_id": 1
}

Response: {
  "available": true,
  "conflicts": [],
  "next_available": "10:30"
}
```

#### Debug & Development Endpoints
```bash
# Get all appointments (debug)
GET /wp-json/appointease/v1/debug/appointments
Response: {
  "all_appointments": [...],
  "total_count": 150,
  "by_status": {
    "confirmed": 120,
    "cancelled": 20,
    "completed": 10
  }
}

# System health check
GET /wp-json/appointease/v1/health
Response: {
  "status": "healthy",
  "database": "connected",
  "email": "configured",
  "version": "1.0.0"
}
```

## Business Logic & Rules

### Working Days Configuration
```php
// Default working days (Monday=1, Sunday=7)
$working_days = get_option('appointease_working_days', [1,2,3,4,5]);

// Business hours per day
$business_hours = [
    'monday' => ['start' => '09:00', 'end' => '17:00'],
    'tuesday' => ['start' => '09:00', 'end' => '17:00'],
    'wednesday' => ['start' => '09:00', 'end' => '17:00'],
    'thursday' => ['start' => '09:00', 'end' => '17:00'],
    'friday' => ['start' => '09:00', 'end' => '17:00'],
    'saturday' => ['closed' => true],
    'sunday' => ['closed' => true]
];
```

### Time Slot Management
```typescript
// Frontend time slot generation
const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9:00 AM
    const endHour = 17;   // 5:00 PM
    const interval = 30;  // 30 minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
        }
    }
    
    return slots; // ['09:00', '09:30', '10:00', ...]
};

// Filter available slots
const getAvailableSlots = (allSlots, unavailableSlots) => {
    return allSlots.filter(slot => !unavailableSlots.includes(slot));
};
```

### Validation Rules Engine
```php
// Backend validation system
class Booking_Validator {
    public function validate_appointment($data) {
        $errors = [];
        
        // 1. Past date validation
        if (strtotime($data['appointment_date']) < time()) {
            $errors[] = 'Cannot book appointments in the past';
        }
        
        // 2. Advance booking limit (30 days)
        $max_advance = strtotime('+30 days');
        if (strtotime($data['appointment_date']) > $max_advance) {
            $errors[] = 'Cannot book more than 30 days in advance';
        }
        
        // 3. Working hours validation
        if (!$this->is_within_business_hours($data['appointment_date'])) {
            $errors[] = 'Appointment must be within business hours';
        }
        
        // 4. Working day validation
        if (!$this->is_working_day($data['appointment_date'])) {
            $errors[] = 'Appointment must be on a working day';
        }
        
        // 5. Double booking prevention
        if ($this->is_slot_booked($data['appointment_date'], $data['employee_id'])) {
            $errors[] = 'This time slot is already booked';
        }
        
        // 6. Blackout dates check
        if ($this->is_blackout_date($data['appointment_date'])) {
            $errors[] = 'This date is not available for bookings';
        }
        
        return empty($errors) ? true : $errors;
    }
    
    private function is_within_business_hours($datetime) {
        $time = date('H:i', strtotime($datetime));
        $day = strtolower(date('l', strtotime($datetime)));
        
        $hours = get_option('appointease_business_hours', [
            $day => ['start' => '09:00', 'end' => '17:00']
        ]);
        
        if (!isset($hours[$day]) || isset($hours[$day]['closed'])) {
            return false;
        }
        
        return $time >= $hours[$day]['start'] && $time < $hours[$day]['end'];
    }
}
```

### Email Template System
```php
// Dynamic email templates with variables
class Email_Template_Manager {
    private $templates = [
        'confirmation' => [
            'subject' => 'Appointment Confirmed - {{appointment_id}}',
            'body' => 'Dear {{customer_name}}, your appointment on {{appointment_date}} has been confirmed.'
        ],
        'cancellation' => [
            'subject' => 'Appointment Cancelled - {{appointment_id}}',
            'body' => 'Dear {{customer_name}}, your appointment has been cancelled.'
        ],
        'reschedule' => [
            'subject' => 'Appointment Rescheduled - {{appointment_id}}',
            'body' => 'Dear {{customer_name}}, your appointment has been moved to {{appointment_date}}.'
        ]
    ];
    
    public function send_template_email($type, $email, $variables) {
        $template = $this->templates[$type];
        
        $subject = $this->replace_variables($template['subject'], $variables);
        $body = $this->replace_variables($template['body'], $variables);
        
        return wp_mail($email, $subject, $body);
    }
    
    private function replace_variables($text, $variables) {
        foreach ($variables as $key => $value) {
            $text = str_replace('{{' . $key . '}}', $value, $text);
        }
        return $text;
    }
}
```

## WebSocket Real-time System

### Architecture Overview

AppointEase uses a **hybrid WebSocket/Polling system** for real-time updates:

1. **Primary**: WebSocket connection for instant updates
2. **Fallback**: HTTP long-polling when WebSocket unavailable
3. **Backup**: WordPress Heartbeat API integration

### Frontend Implementation

#### RealtimeService Class (`src/services/realtimeService.ts`)
```typescript
const service = createRealtimeService({
  wsUrl: 'ws://example.com/wp-json/appointease/v1/realtime/poll',
  pollingUrl: '/wp-json/appointease/v1/realtime/poll',
  pollingInterval: 5000
});

// Connect (tries WebSocket first, falls back to polling)
await service.connect();

// Subscribe to events
service.on('update', (data) => {
  console.log('New appointment data:', data);
});

// Send message (WebSocket only)
service.send('subscribe', { email: 'user@example.com' });

// Check connection status
const mode = service.getMode(); // 'websocket' | 'polling' | 'disconnected'
```

#### React Hook (`src/hooks/useRealtime.ts`)
```typescript
const { connectionMode, isConnected, send, subscribe } = useRealtime({
  wsUrl: 'ws://example.com/realtime',
  pollingUrl: '/wp-json/appointease/v1/realtime/poll',
  pollingInterval: 5000,
  enabled: true,
  onUpdate: (data) => {
    // Handle real-time updates
    setAppointments(data.appointments);
  },
  onConnectionChange: (mode) => {
    console.log('Connection mode:', mode);
  }
});
```

### Backend Implementation

#### WebSocket Server (`includes/class-websocket-server.php`)

**Long-Polling Endpoint**
```php
GET /wp-json/appointease/v1/realtime/poll?email=user@example.com&last_update=1234567890

Response:
{
  "type": "update",
  "data": {
    "appointments": [...],
    "count": 5
  },
  "timestamp": 1234567890
}
```

**Subscribe Endpoint**
```php
POST /wp-json/appointease/v1/realtime/subscribe
Body: {
  "email": "user@example.com",
  "events": ["appointment.created", "appointment.updated"]
}

Response:
{
  "success": true,
  "subscription_id": "appointease_subscription_abc123",
  "events": ["appointment.created", "appointment.updated"]
}
```

**Broadcast Endpoint** (Admin only)
```php
POST /wp-json/appointease/v1/realtime/broadcast
Body: {
  "event": "appointment.created",
  "data": {...}
}

Response:
{
  "success": true,
  "broadcast_id": "appointease_broadcast_1234567890",
  "recipients": "all"
}
```

### Connection Flow

```
1. Frontend Initialization
   ↓
2. Try WebSocket Connection
   ↓
3a. WebSocket Success          3b. WebSocket Failed
    ↓                              ↓
4a. Real-time Updates          4b. Start HTTP Polling
    ↓                              ↓
5a. Instant Push               5b. Poll Every 5 Seconds
    ↓                              ↓
6. Update UI State             6. Update UI State
```

### WordPress Heartbeat Integration

```javascript
// Frontend: Send heartbeat data
jQuery(document).on('heartbeat-send', function(e, data) {
  data.appointease_realtime = {
    email: 'user@example.com',
    last_update: Date.now()
  };
});

// Frontend: Receive heartbeat response
jQuery(document).on('heartbeat-tick', function(e, data) {
  if (data.appointease_realtime) {
    updateAppointments(data.appointease_realtime.data);
  }
});
```

```php
// Backend: Handle heartbeat
public function handle_heartbeat($response, $data) {
  if (isset($data['appointease_realtime'])) {
    $email = $data['appointease_realtime']['email'];
    $updates = $this->check_for_updates($email);
    
    $response['appointease_realtime'] = [
      'type' => 'update',
      'data' => $updates,
      'timestamp' => time()
    ];
  }
  return $response;
}
```

### Performance Optimizations

1. **Connection Pooling**: Reuse WebSocket connections
2. **Automatic Reconnection**: 5 retry attempts with exponential backoff
3. **Graceful Degradation**: Seamless fallback to polling
4. **Efficient Polling**: Only fetch when data changes
5. **Transient Caching**: Store subscriptions in WordPress transients

### Security Measures

1. **Email Validation**: All requests validate email format
2. **Rate Limiting**: Prevent polling abuse
3. **Nonce Verification**: WordPress nonce for admin endpoints
4. **Sanitization**: All inputs sanitized before database queries
5. **Permission Checks**: Admin-only broadcast endpoint

### Monitoring & Debugging

```typescript
// Check connection status
const mode = service.getMode();
console.log('Connection mode:', mode); // 'websocket' | 'polling' | 'disconnected'

// Monitor connection changes
service.on('connection', (data) => {
  console.log('Connection status:', data);
  // { mode: 'websocket', status: 'connected' }
});

// Debug panel shows real-time connection info
<DebugPanel connectionMode={connectionMode} />
```

### Production Deployment

#### Option 1: HTTP Polling Only (Simplest)
```typescript
const { connectionMode } = useRealtime({
  // No wsUrl = polling only
  pollingUrl: '/wp-json/appointease/v1/realtime/poll',
  pollingInterval: 5000,
  enabled: true
});
```

#### Option 2: WebSocket + Polling (Recommended)
```typescript
const { connectionMode } = useRealtime({
  wsUrl: 'wss://yourdomain.com/realtime', // Requires WebSocket server
  pollingUrl: '/wp-json/appointease/v1/realtime/poll',
  pollingInterval: 10000,
  enabled: true
});
```

#### Option 3: WordPress Heartbeat Only
```javascript
// Disable custom real-time service
// Use WordPress Heartbeat API (15-60 second intervals)
wp.heartbeat.interval('fast'); // 5 seconds
```

### WebSocket Server Setup (Optional)

For true WebSocket support, you can set up a Node.js WebSocket server:

```javascript
// websocket-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    // Handle subscription, broadcast, etc.
  });
});
```

Then configure WordPress to proxy WebSocket requests:
```nginx
location /realtime {
  proxy_pass http://localhost:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

## Deployment & Production

### WordPress Integration
```php
// Plugin activation creates database tables
register_activation_hook(__FILE__, ['Booking_Activator', 'activate']);

// Gutenberg block registration
register_block_type('appointease/booking-form', [
    'render_callback' => [$this, 'render_booking_block'],
    'supports' => [
        'align' => ['wide', 'full'],
        'color' => ['background', 'text'],
        'spacing' => ['margin', 'padding']
    ]
]);

// REST API initialization
add_action('rest_api_init', function() {
    new Booking_API_Endpoints();
});
```

### Security Implementation
```php
// Nonce verification for all API calls
if (!wp_verify_nonce($_REQUEST['_wpnonce'], 'wp_rest')) {
    wp_die('Security check failed');
}

// Input sanitization
$name = sanitize_text_field($_POST['name']);
$email = sanitize_email($_POST['email']);
$date = sanitize_text_field($_POST['date']);

// SQL injection prevention
$wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}appointease_appointments WHERE id = %d",
    $appointment_id
);

// Rate limiting for OTP
if ($this->get_recent_otp_attempts($email) >= 3) {
    return new WP_Error('rate_limit', 'Too many attempts');
}
```

### Performance Optimizations
```typescript
// Frontend optimizations
- React.memo() for component memoization
- useCallback() for function memoization
- Lazy loading for large components
- API response caching
- Debounced API calls
- Virtual scrolling for large lists

// Backend optimizations
- Database indexing on frequently queried columns
- Query result caching
- Optimized SQL queries
- CDN for static assets
- Gzip compression
```

### Monitoring & Debugging
```typescript
// Debug panel features
- Real-time state inspection
- API call logging
- Performance metrics
- Error tracking
- Database query monitoring
- User session tracking

// Production monitoring
- Error logging to WordPress debug.log
- Performance tracking
- User analytics
- Appointment conversion rates
- System health checks
```

This architecture provides a robust, scalable appointment booking system with modern React frontend and secure PHP backend, fully integrated with WordPress ecosystem and optimized for production use.