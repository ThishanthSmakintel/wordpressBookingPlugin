# Testing Guide

## Unit Tests

Run component unit tests:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## E2E Tests

Run end-to-end tests:
```bash
npm run test:e2e
```

Run specific test file:
```bash
npx playwright test block-editor.spec.js
```

## Test Structure

```
tests/
├── blocks/              # Unit tests for block components
│   ├── StepIndicator.test.tsx
│   ├── ServiceCard.test.tsx
│   └── BlockHeader.test.tsx
├── e2e/                 # End-to-end tests
│   └── block-editor.spec.js
├── setup.js             # Jest setup
└── README.md            # This file
```

## Writing Tests

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
    it('renders correctly', () => {
        render(<MyComponent />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });
});
```

### E2E Test Example
```javascript
test('should insert block', async ({ page }) => {
    await page.goto('/wp-admin/post-new.php');
    await page.click('.block-editor-inserter__toggle');
    await page.fill('.block-editor-inserter__search-input', 'AppointEase');
    await page.click('.editor-block-list-item-appointease-booking-form');
});
```

## Coverage Goals

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release tags
