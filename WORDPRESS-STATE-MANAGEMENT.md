# WordPress State Management Implementation

## Overview
Implemented proper WordPress state management using `@wordpress/data` package following official WordPress/Gutenberg patterns.

## Architecture

### WordPress Data Store (`src/store/wordpress-store.ts`)
Following the official WordPress data store pattern with:
- **Reducer**: Pure function managing state transitions
- **Actions**: Dispatched to modify state
- **Selectors**: Read state values
- **Controls**: Handle side effects (API calls)

### React Hook (`src/hooks/useAppointmentStore.ts`)
Custom hook wrapping WordPress data store for React components.

## Usage Examples

### 1. Basic Component Usage

```typescript
import { useAppointmentStore } from '../hooks/useAppointmentStore';

const MyComponent = () => {
    const {
        appointments,
        isLoading,
        cancelAppointment,
        fetchAppointments,
    } = useAppointmentStore();

    const handleCancel = async (appointmentId: string, email: string) => {
        const result = await cancelAppointment(appointmentId, email);
        if (result.success) {
            console.log('Cancelled successfully');
        }
    };

    return (
        <div>
            {isLoading ? 'Loading...' : `${appointments.length} appointments`}
        </div>
    );
};
```

### 2. Cancel Appointment with Auto-Refresh

```typescript
const CancelButton = ({ appointmentId, userEmail }) => {
    const { cancelAppointment, isLoading } = useAppointmentStore();

    const handleClick = async () => {
        // Automatically updates local state and refreshes from API
        const result = await cancelAppointment(appointmentId, userEmail);
        
        if (result.success) {
            // State is already updated - no manual refresh needed!
            console.log('Appointment cancelled and list refreshed');
        }
    };

    return (
        <button onClick={handleClick} disabled={isLoading}>
            {isLoading ? 'Cancelling...' : 'Cancel Appointment'}
        </button>
    );
};
```

### 3. Fetch Appointments

```typescript
const Dashboard = ({ userEmail }) => {
    const { appointments, fetchAppointments, isLoading } = useAppointmentStore();

    useEffect(() => {
        fetchAppointments(userEmail);
    }, [userEmail]);

    return (
        <div>
            {isLoading && <Spinner />}
            {appointments.map(apt => (
                <AppointmentCard key={apt.id} appointment={apt} />
            ))}
        </div>
    );
};
```

### 4. Booking Flow

```typescript
const BookingFlow = () => {
    const {
        step,
        selectedService,
        selectedEmployee,
        selectedDate,
        selectedTime,
        setStep,
        setSelectedService,
        setSelectedEmployee,
        setSelectedDate,
        setSelectedTime,
    } = useAppointmentStore();

    return (
        <div>
            {step === 1 && (
                <ServiceSelector
                    selected={selectedService}
                    onSelect={(service) => {
                        setSelectedService(service);
                        setStep(2);
                    }}
                />
            )}
            {step === 2 && (
                <EmployeeSelector
                    selected={selectedEmployee}
                    onSelect={(employee) => {
                        setSelectedEmployee(employee);
                        setStep(3);
                    }}
                />
            )}
            {/* ... more steps */}
        </div>
    );
};
```

### 5. Error Handling

```typescript
const FormComponent = () => {
    const { errors, setError, clearErrors } = useAppointmentStore();

    const handleSubmit = () => {
        clearErrors();
        
        if (!isValid) {
            setError('email', 'Invalid email address');
            return;
        }
        
        // Submit...
    };

    return (
        <div>
            <input type="email" />
            {errors.email && <span className="error">{errors.email}</span>}
        </div>
    );
};
```

## Benefits

### 1. WordPress Standard Compliance
- ✅ Uses official `@wordpress/data` package
- ✅ Follows Gutenberg patterns
- ✅ Compatible with WordPress ecosystem
- ✅ Future-proof architecture

### 2. Automatic State Updates
```typescript
// Before: Manual state update needed
const handleCancel = async () => {
    await cancelAPI(id);
    await fetchAppointments(); // Manual refresh
    setAppointments(newData);  // Manual update
};

// After: Automatic with WordPress store
const handleCancel = async () => {
    await cancelAppointment(id, email);
    // State automatically updated! ✨
};
```

### 3. Optimistic Updates
```typescript
// Immediately updates UI, then syncs with server
cancelAppointment(id, email);
// UI shows "cancelled" instantly
// Then fetches fresh data from API
```

### 4. Centralized State
- Single source of truth
- No prop drilling
- Consistent across components
- Easy debugging with Redux DevTools

### 5. Performance Optimized
- Memoized selectors
- Batched updates
- Minimal re-renders
- Efficient data flow

## API Integration

### Automatic API Calls
The store handles API calls automatically:

```typescript
// This action:
cancelAppointment(appointmentId, email)

// Automatically:
// 1. Sets loading state
// 2. Calls DELETE /appointease/v1/appointments/{id}
// 3. Updates local state optimistically
// 4. Fetches fresh data from API
// 5. Clears loading state
// 6. Handles errors
```

### Custom API Calls
```typescript
const controls = {
    FETCH_FROM_API(action) {
        const { path, method, data } = action;
        const url = `${window.bookingAPI.root}${path}`;
        
        return fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.bookingAPI.nonce,
            },
            credentials: 'same-origin',
            body: data ? JSON.stringify(data) : undefined,
        }).then(res => res.json());
    },
};
```

## Migration Guide

### From Zustand to WordPress Data

**Before (Zustand):**
```typescript
import { useBookingStore } from './store/bookingStore';

const Component = () => {
    const appointments = useBookingStore(state => state.appointments);
    const setAppointments = useBookingStore(state => state.setAppointments);
};
```

**After (WordPress Data):**
```typescript
import { useAppointmentStore } from './hooks/useAppointmentStore';

const Component = () => {
    const { appointments, setAppointments } = useAppointmentStore();
};
```

### Key Differences

| Feature | Zustand | WordPress Data |
|---------|---------|----------------|
| Package | `zustand` | `@wordpress/data` |
| Pattern | Custom hooks | Redux-like store |
| Side Effects | Manual | Built-in controls |
| DevTools | Limited | Full Redux DevTools |
| WordPress | Not standard | Official standard |
| Async Actions | Manual | Generator functions |

## Advanced Features

### 1. Derived State (Selectors)
```typescript
// Automatically computed
const { upcomingAppointments } = useAppointmentStore();
// Returns only future, non-cancelled appointments
```

### 2. Generator Actions (Async)
```typescript
*cancelAppointment(id, email) {
    yield setLoading(true);
    yield { type: 'FETCH_FROM_API', path: `/appointments/${id}`, method: 'DELETE' };
    yield updateAppointmentStatus(id, 'cancelled');
    yield fetchAppointments(email);
    yield setLoading(false);
}
```

### 3. Middleware Support
```typescript
// Add logging, analytics, etc.
const store = createReduxStore('appointease/booking', {
    reducer,
    actions,
    selectors,
    controls,
    middleware: [loggingMiddleware, analyticsMiddleware],
});
```

## Testing

### Unit Tests
```typescript
import { store } from './wordpress-store';

test('cancels appointment', () => {
    const state = store.getState();
    store.dispatch(store.actions.updateAppointmentStatus('APT-123', 'cancelled'));
    
    const newState = store.getState();
    expect(newState.appointments[0].status).toBe('cancelled');
});
```

### Integration Tests
```typescript
import { render } from '@testing-library/react';
import { useAppointmentStore } from './useAppointmentStore';

test('fetches appointments', async () => {
    const { result } = renderHook(() => useAppointmentStore());
    
    await act(async () => {
        await result.current.fetchAppointments('test@example.com');
    });
    
    expect(result.current.appointments).toHaveLength(5);
});
```

## Debugging

### Redux DevTools
```javascript
// Install Redux DevTools browser extension
// Store automatically connects
// View state, actions, time-travel debugging
```

### Console Logging
```typescript
// Enable debug mode
window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?.({ trace: true });

// Log all actions
store.subscribe(() => {
    console.log('State updated:', store.getState());
});
```

## Best Practices

### 1. Use Selectors
```typescript
// ✅ Good - uses selector
const { upcomingAppointments } = useAppointmentStore();

// ❌ Bad - manual filtering
const { appointments } = useAppointmentStore();
const upcoming = appointments.filter(apt => new Date(apt.date) > new Date());
```

### 2. Batch Updates
```typescript
// ✅ Good - single action
updateBookingData({ service, employee, date, time });

// ❌ Bad - multiple actions
setSelectedService(service);
setSelectedEmployee(employee);
setSelectedDate(date);
setSelectedTime(time);
```

### 3. Handle Loading States
```typescript
// ✅ Good - shows loading
const { isLoading, appointments } = useAppointmentStore();
return isLoading ? <Spinner /> : <List items={appointments} />;

// ❌ Bad - no loading state
const { appointments } = useAppointmentStore();
return <List items={appointments} />;
```

## Resources

- [WordPress Data Package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [React Hooks](https://react.dev/reference/react)

## Conclusion

This WordPress-compliant state management provides:
- ✅ Official WordPress standards
- ✅ Automatic state updates
- ✅ Optimistic UI updates
- ✅ Built-in API integration
- ✅ Redux DevTools support
- ✅ Type-safe with TypeScript
- ✅ Performance optimized
- ✅ Easy to test

**Result:** Professional, maintainable, WordPress-standard state management! 🎉
