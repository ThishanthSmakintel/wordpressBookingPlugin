# Fix: Cloudflare Rate Limiting & Request Blocking

**Date:** 2025-01-15  
**Issue:** Continuous requests blocked by Cloudflare  
**Solution:** Exponential backoff retry logic

## Problem

Cloudflare can block requests when:
- **429 Too Many Requests** - Rate limit exceeded
- **5xx Server Errors** - Backend overload or firewall rules
- **Challenge Pages** - Bot detection triggered
- **Firewall Rules** - Custom security rules matched

## Solution

Added retry logic with exponential backoff to `checkAvailability()`:

### Changes Made

**File:** `src/hooks/useBookingActions.ts`

**Added:**
- `retryCount` parameter (default: 0)
- 429/5xx status code detection
- Exponential backoff: 1s → 2s → 4s (max 5s)
- Max 3 retry attempts

**Retry Logic:**
```typescript
if (response.status === 429 || response.status >= 500) {
    if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return checkAvailability(date, employeeId, retryCount + 1);
    }
}
```

## How It Works

1. **First attempt** - Immediate request
2. **429/5xx detected** - Wait 1 second, retry
3. **Still failing** - Wait 2 seconds, retry
4. **Still failing** - Wait 4 seconds, retry
5. **Max retries** - Give up, show empty slots

## Cloudflare Best Practices

### 1. Whitelist Your API Endpoints
In Cloudflare dashboard:
- **Security → WAF** → Add rule
- **URI Path contains** `/wp-json/`
- **Action:** Allow

### 2. Adjust Rate Limiting
- **Security → Rate Limiting Rules**
- Increase threshold for `/wp-json/booking/v1/availability`
- Example: 60 requests per minute per IP

### 3. Bypass Bot Detection
- **Security → Bots** → Configure
- Add exception for your domain's API calls

### 4. Cache API Responses (Optional)
```javascript
// Add cache headers in PHP
header('Cache-Control: public, max-age=30');
```

## Testing

1. Make rapid availability checks
2. Verify retries in browser console
3. Check for 429 errors in Network tab
4. Confirm successful retry after delay

## Alternative Solutions

### Option 1: Debounce Requests (Frontend)
```typescript
const debouncedCheck = debounce(checkAvailability, 500);
```

### Option 2: Request Batching
Combine multiple date checks into single request

### Option 3: Cloudflare Page Rules
- **Page Rule:** `*news.thishanth.com/wp-json/*`
- **Settings:** Security Level = Essentially Off

## Impact

✅ **Resilient:** Handles temporary Cloudflare blocks  
✅ **User-friendly:** Transparent retries  
✅ **Efficient:** Exponential backoff prevents spam  
✅ **Minimal:** Only 3 retries max (< 8 seconds total)

## Monitoring

Check browser console for retry logs:
```
[Retry 1] Waiting 1000ms...
[Retry 2] Waiting 2000ms...
[Retry 3] Waiting 4000ms...
```
