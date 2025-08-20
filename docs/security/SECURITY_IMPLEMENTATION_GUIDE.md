# Phase 3 Tour Security Implementation Guide

This guide provides comprehensive instructions for implementing the security measures identified in the tour system security audit.

## Quick Start Implementation

### 1. Install Required Dependencies

```bash
npm install dompurify @types/dompurify
```

### 2. Initialize Security System

Add to your app initialization (e.g., `layout.tsx` or `_app.tsx`):

```typescript
import { TourSecurityManager } from '@/utils/tour-security-enhancements';

// Initialize security system
TourSecurityManager.initialize({
  cspNonce: process.env.CSP_NONCE,
  enablePerformanceMonitoring: true,
  enableMemoryMonitoring: true,
});
```

### 3. Implement CSP Headers

Update your `next.config.js`:

```javascript
const { buildCSPHeader } = require('./src/utils/tour-csp-config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildCSPHeader(),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Security Implementation Checklist

### Phase 1: Critical Security Measures (Week 1)

- [ ] **CSP Headers Implementation**
  - [ ] Add CSP headers to Next.js configuration
  - [ ] Implement nonce generation for inline styles
  - [ ] Test CSP compliance with tour overlays
  - [ ] Set up CSP violation reporting

- [ ] **Enhanced Input Validation**
  - [ ] Integrate `tour-security-validator.ts` into tour creation flows
  - [ ] Add JSON schema validation for tour configurations
  - [ ] Implement callback function sanitization
  - [ ] Add server-side validation for all tour endpoints

- [ ] **Memory Leak Prevention**
  - [ ] Initialize `EnhancedMemoryManager`
  - [ ] Implement automatic cleanup timers
  - [ ] Add memory usage monitoring
  - [ ] Set up resource limit enforcement

- [ ] **Security Validation Utilities**
  - [ ] Integrate `tour-security-enhancements.ts`
  - [ ] Set up color validation for adaptive overlays
  - [ ] Implement rate limiting for intensive operations
  - [ ] Add security event logging

### Phase 2: Performance and Monitoring (Week 2)

- [ ] **Performance Security Monitoring**
  - [ ] Initialize `TourPerformanceMonitor`
  - [ ] Set up performance threshold alerts
  - [ ] Implement resource usage tracking
  - [ ] Add performance degradation detection

- [ ] **Advanced Rate Limiting**
  - [ ] Implement tour concurrency management
  - [ ] Add user-based operation limits
  - [ ] Set up distributed rate limiting (if applicable)
  - [ ] Monitor for abuse patterns

- [ ] **Security Event Logging**
  - [ ] Set up security event collection
  - [ ] Implement real-time alerting
  - [ ] Add log analysis and correlation
  - [ ] Create security dashboard integration

- [ ] **Accessibility Enhancements**
  - [ ] Integrate `tour-accessibility-validator.ts`
  - [ ] Implement WCAG AA compliance checking
  - [ ] Add automated accessibility testing
  - [ ] Set up accessibility monitoring

### Phase 3: Advanced Security Features (Week 3)

- [ ] **Advanced Security Features**
  - [ ] Implement tour fingerprinting
  - [ ] Add behavioral analysis
  - [ ] Set up anomaly detection
  - [ ] Create security analytics dashboard

- [ ] **Comprehensive Testing Suite**
  - [ ] Create XSS prevention tests
  - [ ] Add memory leak detection tests
  - [ ] Implement performance regression tests
  - [ ] Add accessibility compliance tests

- [ ] **Security Documentation**
  - [ ] Complete security runbook
  - [ ] Create incident response procedures
  - [ ] Document security best practices
  - [ ] Add security training materials

- [ ] **Monitoring Dashboard**
  - [ ] Deploy `TourSecurityDashboard` component
  - [ ] Set up real-time metrics display
  - [ ] Add alerting and notification system
  - [ ] Create security reporting tools

## Implementation Examples

### 1. Secure Tour Initialization

```typescript
import { 
  validateTourConfig, 
  createSecurityContext,
  TourSecurityManager 
} from '@/utils/tour-security-enhancements';

async function initializeTour(tourConfig: any, userId?: string) {
  // Create security context
  const context = createSecurityContext(userId);
  
  // Validate tour execution permissions
  const validation = TourSecurityManager.validateTourExecution(tourConfig, context);
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }
  
  // Register tour for concurrency tracking
  if (!TourConcurrencyManager.registerTour(tourConfig.id)) {
    throw new Error('Tour concurrency limit exceeded');
  }
  
  // Initialize tour with security measures
  const tour = new TourManager(tourConfig);
  
  // Clean up on completion
  tour.onComplete(() => {
    TourConcurrencyManager.unregisterTour(tourConfig.id);
  });
  
  return tour;
}
```

### 2. Secure Color Adaptation

```typescript
import { SecureColorAdapter, createSecurityContext } from '@/utils/tour-security-enhancements';

function applySecureColorAdaptation(colorConfig: any, userId?: string) {
  const context = createSecurityContext(userId);
  
  // Apply colors using secure methods
  const success = SecureColorAdapter.securelyApplyAdaptiveStyles(colorConfig, context);
  
  if (!success) {
    console.warn('Failed to apply color adaptation due to security constraints');
    // Fall back to default colors
    applyDefaultColors();
  }
}
```

### 3. Accessibility-Compliant Tour

```typescript
import { TourAccessibilityValidator } from '@/utils/tour-accessibility-validator';

function createAccessibleTour(tourConfig: any) {
  // Validate accessibility before tour start
  const mockOverlay = createMockOverlay(tourConfig);
  const report = TourAccessibilityValidator.validateTourOverlay(mockOverlay);
  
  if (!report.isCompliant) {
    console.warn('Tour accessibility issues:', report.issues);
    // Apply accessibility fixes or warn user
    applyAccessibilityFixes(tourConfig, report.issues);
  }
  
  return tourConfig;
}
```

## Security Testing Procedures

### 1. XSS Prevention Tests

```typescript
// Test malicious HTML injection
const maliciousConfigs = [
  { title: '<script>alert("XSS")</script>' },
  { description: 'javascript:alert("XSS")' },
  { element: '<img src=x onerror=alert("XSS")>' },
];

maliciousConfigs.forEach(config => {
  const validation = validateTourConfig(config, createSecurityContext());
  expect(validation.isValid).toBe(false);
});
```

### 2. Memory Leak Tests

```typescript
// Test for memory leaks during tour execution
async function testMemoryLeaks() {
  const initialMemory = getMemoryUsage();
  
  // Create and destroy multiple tours
  for (let i = 0; i < 100; i++) {
    const tour = await initializeTour(testConfig);
    await tour.start();
    await tour.destroy();
  }
  
  // Force garbage collection
  if (global.gc) global.gc();
  
  const finalMemory = getMemoryUsage();
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
}
```

### 3. Performance Tests

```typescript
// Test performance under load
async function testPerformanceUnderLoad() {
  const startTime = performance.now();
  
  // Start multiple concurrent tours
  const tours = await Promise.all(
    Array(5).fill(null).map(() => initializeTour(testConfig))
  );
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(1000); // Less than 1 second
  
  // Clean up
  await Promise.all(tours.map(tour => tour.destroy()));
}
```

## Monitoring and Alerting

### 1. Set Up Security Event Monitoring

```typescript
// Monitor security events in production
function setupSecurityMonitoring() {
  // Listen for security events
  document.addEventListener('securityEvent', (event) => {
    const { type, severity, details } = event.detail;
    
    // Send to monitoring service
    sendToMonitoring({
      type: 'tour_security_event',
      severity,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
    
    // Alert on high severity events
    if (severity === 'high') {
      sendSecurityAlert({
        message: `High severity tour security event: ${type}`,
        details,
      });
    }
  });
}
```

### 2. Performance Monitoring

```typescript
// Set up performance monitoring
function setupPerformanceMonitoring() {
  // Monitor tour performance
  TourPerformanceMonitor.startMonitoring();
  
  // Set up alerts for performance degradation
  setInterval(() => {
    const report = TourPerformanceMonitor.getPerformanceReport();
    
    Object.entries(report).forEach(([metric, data]) => {
      if (data.avg > 100) { // 100ms threshold
        sendPerformanceAlert({
          metric,
          averageDuration: data.avg,
          threshold: 100,
        });
      }
    });
  }, 30000); // Check every 30 seconds
}
```

## Production Deployment

### 1. Environment Variables

Add to your `.env.production`:

```bash
# Security Configuration
CSP_NONCE_SECRET=your-secret-key-here
SECURITY_MONITORING_ENDPOINT=https://your-monitoring-service.com/api/events
ENABLE_SECURITY_LOGGING=true

# Performance Monitoring
PERFORMANCE_THRESHOLD_MS=50
MEMORY_LIMIT_MB=100
MAX_CONCURRENT_TOURS=2
```

### 2. Server Configuration

Add security headers to your server configuration:

```nginx
# Nginx configuration
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### 3. Monitoring Setup

Set up monitoring dashboards and alerts:

```typescript
// Production monitoring setup
if (process.env.NODE_ENV === 'production') {
  // Initialize security monitoring
  TourSecurityManager.initialize({
    cspNonce: process.env.CSP_NONCE,
    enablePerformanceMonitoring: true,
    enableMemoryMonitoring: true,
  });
  
  // Set up alert thresholds
  setSecurityAlertThresholds({
    memoryUsage: 100, // 100MB
    performanceThreshold: 100, // 100ms
    errorRate: 0.05, // 5% error rate
  });
}
```

## Troubleshooting Common Issues

### 1. CSP Violations

**Problem**: Tour styles not loading due to CSP violations

**Solution**:
```typescript
// Use nonce-based styles
const nonce = getCSPNonce();
const secureStyle = createSecureInlineStyle(tourCSS, nonce);
document.head.appendChild(secureStyle);
```

### 2. Memory Leaks

**Problem**: Memory usage increasing during tour usage

**Solution**:
```typescript
// Ensure proper cleanup
tour.onDestroy(() => {
  EnhancedMemoryManager.cleanup();
  TourConcurrencyManager.unregisterTour(tourId);
});
```

### 3. Performance Issues

**Problem**: Tours becoming slow or unresponsive

**Solution**:
```typescript
// Limit concurrent tours and implement throttling
if (!TourConcurrencyManager.canStartTour(tourId)) {
  showUserMessage('Too many tours active. Please wait and try again.');
  return;
}
```

## Best Practices Summary

1. **Always validate input** - Use the provided validation utilities for all tour configurations
2. **Implement proper cleanup** - Ensure all resources are properly cleaned up when tours end
3. **Monitor performance** - Use the performance monitoring tools to detect issues early
4. **Test accessibility** - Regularly run accessibility checks to ensure WCAG compliance
5. **Log security events** - Implement comprehensive security event logging for monitoring
6. **Use CSP-compatible methods** - Always use the provided CSP-compatible styling utilities
7. **Limit resource usage** - Implement proper rate limiting and resource constraints
8. **Handle errors gracefully** - Provide fallbacks for security failures that don't break user experience

## Support and Maintenance

- Review security logs weekly
- Update security configurations monthly
- Run full security audits quarterly
- Keep dependencies updated
- Monitor for new security vulnerabilities

For questions or issues, refer to the security team documentation or create a security incident ticket.