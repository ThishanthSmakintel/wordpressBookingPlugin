# AppointEase Testing Strategy

## Testing Stack
- **Backend**: PHPUnit + WordPress Test Suite
- **Frontend**: Jest + React Testing Library + Cypress
- **Integration**: WordPress REST API testing
- **E2E**: Cypress with WordPress environment

## Setup Commands
```bash
# Install dependencies
composer install
npm install

# Setup WordPress test environment
./bin/install-wp-tests.sh wordpress_test root '' localhost latest

# Run tests
npm run test:all
```

## Test Coverage Goals
- **Backend**: 90%+ code coverage
- **Frontend**: 85%+ code coverage
- **E2E**: All critical user flows
- **API**: All endpoints tested