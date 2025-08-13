/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/help-tours*.test.ts',
    '**/help-menu*.test.tsx',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
    }],
  },
  collectCoverageFrom: [
    'src/components/help/**/*.{ts,tsx}',
    'src/hooks/use-tour*.{ts,tsx}',
    'src/libs/onboarding/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/cache$': '<rootDir>/tests/__mocks__/next-cache.js',
    '^next/navigation$': '<rootDir>/tests/__mocks__/next-navigation.js',
    '^next/dynamic$': '<rootDir>/tests/__mocks__/next-dynamic.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/tests/setup/help-tours-setup.js'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  // Add specific setup for React Testing Library
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

module.exports = config;
