# Testing Documentation

This directory contains all testing-related documentation, guides, and test scenarios for QuoteKit.

## 📁 Contents

### Core Testing Documentation
- `README.md` - Main testing documentation (from tests/)
- `LAWNQUOTE_TESTING_GUIDE.md` - Comprehensive testing guide
- `edge-functions-testing.md` - Edge functions testing guide

### Test Scenarios & Integration
- `subscription-flow-integration-tests.md` - Subscription flow integration tests
- `subscription-flow-test-scenarios.md` - Subscription flow test scenarios

## 🧪 Testing Strategy

### Unit Testing
- Jest configuration in `jest.config.js`
- Test setup in `jest.setup.js`
- Component testing with React Testing Library

### Integration Testing
- Subscription flow testing
- Payment integration testing
- Edge functions testing

### End-to-End Testing
- User journey testing
- Quote creation and PDF generation
- Authentication flows

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run edge functions tests
npm run test:edge-functions
```

## 📋 Test Coverage Areas

- ✅ Authentication flows
- ✅ Quote creation and management
- ✅ PDF generation
- ✅ Stripe integration
- ✅ Subscription management
- ✅ Edge functions
- ✅ Database operations

## 🔧 Testing Tools

- **Jest** - JavaScript testing framework
- **React Testing Library** - React component testing
- **Supertest** - HTTP assertion library
- **MSW** - API mocking
- **Playwright** - End-to-end testing (planned)
