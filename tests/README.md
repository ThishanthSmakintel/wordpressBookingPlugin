# Race Condition Testing

## API Race Condition Test

Tests atomic booking protection by simulating concurrent API requests.

### Setup

```bash
pip install -r requirements.txt
```

### Run Test

```bash
python race-condition-api.py
```

### Configuration

Edit `race-condition-api.py`:
- `BASE_URL` - Your WordPress site URL
- `CONCURRENT_USERS` - Number of simultaneous requests (default: 10)

### Expected Result

✓ **1 successful booking**, 9 failed = Race condition protection working
✗ **Multiple successful bookings** = Double booking detected
