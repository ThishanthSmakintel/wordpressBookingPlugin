import '@testing-library/jest-dom';

// Mock WordPress globals
global.window.bookingAPI = {
  root: 'http://localhost/wp-json/',
  nonce: 'test-nonce'
};

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};