# Race Condition Testing

## Tests

### 1. API Race Condition Test
```bash
python race-condition-api.py
```
Tests atomic booking protection with concurrent API requests.

### 2. Admin Panel Automation
```bash
npm run test:admin
```
Tests all 11 admin pages: Dashboard, Services, Staff, Appointments, Calendar, Customers, Holidays, Settings, Reports, Categories, Emails.

### 3. UI Race Condition Test
```bash
npm run test:ui
```
Tests frontend booking with concurrent users.

### Configuration

Edit `admin-automation.js`:
- `username` - WordPress admin username (default: 'admin')
- `password` - WordPress admin password (default: 'admin')
- `baseUrl` - Your site URL
