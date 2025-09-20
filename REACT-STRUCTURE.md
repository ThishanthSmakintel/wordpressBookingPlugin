# AppointEase React File Structure

## Overview
The AppointEase WordPress booking plugin uses a modular React architecture with TypeScript for maintainable, scalable frontend development.

## Entry Points

### Main Entry
- **`src/app/index.ts`** - Main entry point, exports `BookingApp`
- **`src/app/core/BookingApp.tsx`** - Root React component

### Legacy Entry (Removed)
- ~~`src/frontend-enhanced.tsx`~~ - Removed after modularization

## Directory Structure

```
src/
├── app/                          # New modular architecture
│   ├── core/                     # Core application components
│   │   └── BookingApp.tsx        # Main app component
│   ├── features/                 # Feature-based modules
│   │   ├── appointments/         # Appointment management
│   │   │   ├── components/       # Appointment-specific components
│   │   │   └── hooks/           # Appointment-specific hooks
│   │   ├── authentication/       # Login/OTP/Session management
│   │   │   ├── components/       # Auth components
│   │   │   └── hooks/           # Auth hooks
│   │   ├── booking/             # Booking flow (7 steps)
│   │   │   ├── components/       # Booking components
│   │   │   ├── hooks/           # Booking hooks
│   │   │   └── services/        # Booking services
│   │   └── debug/               # Debug panel functionality
│   │       ├── components/       # Debug components
│   │       └── hooks/           # Debug hooks
│   ├── shared/                  # Shared resources
│   │   ├── components/          # Reusable UI components
│   │   │   ├── forms/           # Form components
│   │   │   ├── layout/          # Layout components
│   │   │   └── ui/              # UI primitives
│   │   ├── constants/           # App constants
│   │   ├── hooks/               # Shared hooks
│   │   ├── services/            # API services
│   │   ├── store/               # State management
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
│   └── index.ts                 # Main export
├── assets/                      # Static assets
│   └── styles/                  # CSS/SCSS files
├── components/ (Legacy)         # Original components (kept for compatibility)
├── hooks/ (Legacy)              # Original hooks (kept for compatibility)
├── modules/ (Legacy)            # Original modules (kept for compatibility)
├── services/ (Legacy)           # Original services (kept for compatibility)
├── store/ (Legacy)              # Original store (kept for compatibility)
├── types/ (Legacy)              # Original types (kept for compatibility)
├── utils/ (Legacy)              # Original utils (kept for compatibility)
└── BookingApp.tsx (Legacy)      # Original main component (kept for compatibility)
```

## Key Components

### Core Application
- **`BookingApp.tsx`** - Main React component with 62 useState hooks
- **`index.ts`** - Entry point exporting BookingApp

### Feature Modules
- **Booking Flow** - 7-step appointment booking process
- **Authentication** - Login, OTP verification, session management
- **Appointments** - View, cancel, reschedule appointments
- **Debug Panel** - Development tools and diagnostics

### Shared Components
- **Forms** - Reusable form components with validation
- **UI** - Button, input, modal, and other UI primitives
- **Layout** - Header, footer, and layout components

## State Management

### Hook Architecture
- **62 useState hooks** in main component
- **Custom hooks** for feature-specific state
- **Shared store** for global state

### Key State Categories
1. **UI State** - Loading, errors, modals, steps
2. **Form State** - User inputs, validation
3. **Data State** - Services, staff, appointments
4. **Session State** - Authentication, user data

## File Naming Conventions

### Components
- **`.component.tsx`** - React components
- **`.tsx`** - Main component files

### Hooks
- **`.hook.ts`** - Custom React hooks
- **`use*.ts`** - Hook files

### Services
- **`.service.ts`** - API and business logic
- **`api.ts`** - API client

### Types
- **`.types.ts`** - TypeScript type definitions
- **`index.ts`** - Type exports

### Constants
- **`.constants.ts`** - Application constants
- **`index.ts`** - Constant exports

### Utils
- **`.utils.ts`** - Utility functions
- **`index.ts`** - Utility exports

## Build Process

### Webpack Configuration
```javascript
entry: {
  frontend: path.resolve(process.cwd(), 'src', 'app', 'index.ts')
}
```

### Build Output
- **`build/frontend.js`** - Bundled React application
- **`build/frontend.css`** - Compiled styles

### WordPress Integration
- **Enqueued as** `booking-frontend` script
- **Loaded on** pages with AppointEase blocks
- **API integration** via `bookingAPI` global

## Development Guidelines

### Component Structure
```typescript
// Feature component example
export const BookingStep: React.FC<BookingStepProps> = ({ 
  step, 
  onNext, 
  onPrev 
}) => {
  // Component logic
  return <div>...</div>;
};
```

### Hook Pattern
```typescript
// Custom hook example
export const useBookingState = () => {
  const [state, setState] = useState(initialState);
  
  const actions = {
    updateStep: (step: number) => setState(prev => ({ ...prev, step }))
  };
  
  return { state, actions };
};
```

### Service Pattern
```typescript
// Service example
export const bookingService = {
  async createAppointment(data: AppointmentData) {
    return await api.post('/appointments', data);
  }
};
```

## Migration Notes

### From Monolithic to Modular
1. **Preserved all functionality** - No features lost
2. **Maintained hook order** - Fixed React Hook Error #300
3. **Backward compatibility** - Legacy files kept
4. **Clean architecture** - Feature-based organization

### Benefits
- **Maintainability** - Clear separation of concerns
- **Scalability** - Easy to add new features
- **Testability** - Isolated components and hooks
- **Reusability** - Shared components and utilities

## WordPress Integration

### Block Registration
```php
register_block_type('appointease/booking-form', [
  'render_callback' => 'render_booking_block'
]);
```

### Script Enqueuing
```php
wp_enqueue_script('booking-frontend', 
  BOOKING_PLUGIN_URL . 'build/frontend.js'
);
```

### API Integration
```javascript
// Available globally
window.bookingAPI = {
  root: '/wp-json/appointease/v1/',
  nonce: 'wp_rest_nonce'
};
```

## Performance Considerations

### Code Splitting
- **Feature modules** can be lazy-loaded
- **Shared components** bundled efficiently
- **Legacy compatibility** maintained

### Bundle Size
- **Modular imports** reduce bundle size
- **Tree shaking** removes unused code
- **CSS optimization** via mini-extract plugin

## Future Enhancements

### Planned Improvements
1. **Lazy loading** for feature modules
2. **Component library** extraction
3. **Storybook** integration
4. **Unit testing** setup
5. **E2E testing** with Cypress

### Architecture Evolution
- **Micro-frontends** for large features
- **State management** with Redux Toolkit
- **GraphQL** integration
- **PWA** capabilities