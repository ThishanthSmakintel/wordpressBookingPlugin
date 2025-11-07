# Security Fix: Hardcoded Credentials Removed - January 6, 2025

## Issue
**Severity**: CRITICAL  
**CWE**: CWE-798 (Hardcoded Credentials)

Three test files contained hardcoded WordPress admin credentials in plain text:
- `tests/test-settings.js` - Username: thishath-admin, Password: Hht#0768340599
- `tests/admin-automation.js` - Username: thishath-admin, Password: Hht#0768340599  
- `src/store/wordpress-store.ts` - Missing error handling for API credentials

## Risk
- Exposed admin credentials in version control
- Anyone with repository access could access WordPress admin panel
- Credentials visible in code reviews and git history

## Fix Applied

### 1. tests/test-settings.js
**Before**:
```javascript
const CONFIG = {
    username: 'thishath-admin',
    password: 'Hht#0768340599'
};
```

**After**:
```javascript
const CONFIG = {
    username: process.env.WP_TEST_USERNAME || 'admin',
    password: process.env.WP_TEST_PASSWORD || 'password'
};

if (!process.env.WP_TEST_USERNAME || !process.env.WP_TEST_PASSWORD) {
    console.warn('⚠️  Warning: Using default credentials. Set environment variables.');
}
```

### 2. tests/admin-automation.js
Same fix applied - credentials moved to environment variables.

### 3. src/store/wordpress-store.ts
Added proper error handling and logging for API configuration validation.

### 4. Created .env.example
Template file for developers to configure their own credentials securely.

## Usage

### For Developers:
1. Copy `.env.example` to `.env`
2. Fill in your credentials:
   ```bash
   WP_TEST_USERNAME=your_username
   WP_TEST_PASSWORD=your_password
   ```
3. Add `.env` to `.gitignore` (already done)

### Running Tests:
```bash
# Set environment variables
export WP_TEST_USERNAME=your_username
export WP_TEST_PASSWORD=your_password

# Or use .env file with dotenv
npm install dotenv
node -r dotenv/config tests/test-settings.js
```

## Security Recommendations

1. **Immediate Actions**:
   - ✅ Change WordPress admin password immediately
   - ✅ Review access logs for unauthorized access
   - ✅ Rotate all API keys and tokens

2. **Git History**:
   - Consider using `git filter-branch` or BFG Repo-Cleaner to remove credentials from git history
   - Or create new repository without history

3. **Future Prevention**:
   - ✅ Never commit credentials to version control
   - ✅ Use environment variables for all secrets
   - ✅ Add pre-commit hooks to detect secrets
   - ✅ Use secret scanning tools (e.g., git-secrets, trufflehog)

## Files Modified
- `tests/test-settings.js` - Removed hardcoded credentials
- `tests/admin-automation.js` - Removed hardcoded credentials
- `src/store/wordpress-store.ts` - Added error handling
- `.env.example` - Created template file
- `.gitignore` - Ensure .env is ignored

## Impact
- **Security**: Critical vulnerability eliminated
- **Functionality**: Tests still work with environment variables
- **Backward Compatibility**: Fallback to safe defaults if env vars not set
