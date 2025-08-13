// Setup file for Help & Tours tests
require('@testing-library/jest-dom');

// Mock window.location
delete window.location;
window.location = {
  pathname: '/dashboard',
  href: '/dashboard',
  search: '',
  hash: '',
};

// Mock window.alert for error handling tests
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true,
});

// Mock setTimeout and clearTimeout
global.setTimeout = jest.fn((fn, delay) => {
  if (typeof fn === 'function') {
    fn();
  }
  return 1;
});

global.clearTimeout = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock IntersectionObserver (used by some UI components)
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock ResizeObserver (used by some UI components)
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  window.location.pathname = '/dashboard';
  window.location.href = '/dashboard';
});
