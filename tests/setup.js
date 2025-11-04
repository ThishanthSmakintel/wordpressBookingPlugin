/**
 * Jest test setup
 */

require('@testing-library/jest-dom');

// Make React available globally
global.React = require('react');

// Mock WordPress element to use React
jest.mock('@wordpress/element', () => require('react'));

// Mock WordPress i18n
jest.mock('@wordpress/i18n', () => ({
    __: jest.fn((text) => text)
}));

// Mock Font Awesome
global.FontAwesome = {};

// Suppress console errors in tests
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    error: jest.fn(),
    warn: jest.fn()
};
