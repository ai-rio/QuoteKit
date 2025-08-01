# Quick Reference - Clean Stripe Integration P3

**Epic**: STRIPE-CLEAN-P3  
**Current Sprint**: Sprint 1  
**Quick Access**: Essential information for daily development

---

## 🎯 **Sprint 1 At-a-Glance**

### **Sprint Goal**
Users can manage payment methods and view billing history entirely within the app

### **Key Deliverables**
- ✅ Enhanced payment methods management
- ✅ Billing history with invoice downloads  
- ✅ Mobile-responsive payment UI
- ✅ Security & validation

### **Story Points**: 21 total
- US-P3-001: 8 points (Payment Methods)
- US-P3-002: 5 points (Billing History)
- US-P3-003: 5 points (Security)
- US-P3-004: 3 points (Mobile UI)

---

## 📁 **Key Files & Locations**

### **Components**
```
src/features/account/components/
├── PaymentMethodsManager.tsx      # Enhance existing
├── AddPaymentMethodDialog.tsx     # Create new
├── PaymentMethodCard.tsx          # Create new
└── BillingHistoryTable.tsx        # Create new
```

### **API Routes**
```
src/app/api/
├── payment-methods/
│   ├── route.ts                   # Enhance existing
│   └── [id]/route.ts             # Enhance existing
└── billing-history/
    └── route.ts                   # Create new
```

### **Server Actions**
```
src/features/account/actions/
└── payment-actions.ts             # Create new
```

### **Hooks**
```
src/features/account/hooks/
└── useBillingHistory.ts           # Create new
```

---

## 🔧 **Development Commands**

### **Essential Commands**
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run type checking
npx tsc --noEmit

# Run linting
npm run lint

# Build for production
npm run build
```

### **Stripe CLI Commands**
```bash
# Listen to webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test webhook events
stripe trigger payment_intent.succeeded

# View Stripe logs
stripe logs tail
```

---

## 🎨 **Design System Quick Reference**

### **Colors**
```css
/* Primary Colors */
--forest-green: #2A3D2F;      /* Primary actions */
--equipment-yellow: #F2B705;   /* Accent elements */
--paper-white: #FFFFFF;        /* Card backgrounds */
--stone-gray: #D7D7D7;         /* Borders */
--charcoal: #1C1C1C;           /* Text */

/* Status Colors */
--success: #10B981;            /* Success states */
--error: #EF4444;              /* Error states */
--warning: #F59E0B;            /* Warning states */
--info: #3B82F6;               /* Info states */
```

### **Typography**
```css
/* Font Families */
font-family: 'Inter', sans-serif;           /* Primary */
font-family: 'Roboto Mono', monospace;      /* Financial values */

/* Font Sizes */
text-xs: 0.75rem;     /* 12px */
text-sm: 0.875rem;    /* 14px */
text-base: 1rem;      /* 16px */
text-lg: 1.125rem;    /* 18px */
text-xl: 1.25rem;     /* 20px */
```

### **Spacing**
```css
/* Common Spacing Values */
space-2: 0.5rem;      /* 8px */
space-4: 1rem;        /* 16px */
space-6: 1.5rem;      /* 24px */
space-8: 2rem;        /* 32px */
```

---

## 🔒 **Security Checklist**

### **Payment Method Security**
- [ ] Use Stripe Elements for card input
- [ ] Never store card details locally
- [ ] Validate all inputs server-side
- [ ] Use HTTPS for all requests
- [ ] Implement rate limiting
- [ ] Log security events

### **API Security**
- [ ] Authenticate all requests
- [ ] Validate request payloads
- [ ] Sanitize user inputs
- [ ] Use proper error messages
- [ ] Implement CORS correctly
- [ ] Rate limit API endpoints

---

## 📱 **Mobile Development Guidelines**

### **Touch Targets**
- Minimum 44px for touch targets
- Adequate spacing between interactive elements
- Consider thumb-friendly navigation

### **Responsive Breakpoints**
```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### **Mobile Testing**
- Test on actual devices when possible
- Use browser dev tools for responsive testing
- Check performance on slower networks
- Verify touch interactions work correctly

---

## 🧪 **Testing Quick Reference**

### **Test File Locations**
```
tests/
├── unit/
│   ├── components/
│   └── api/
├── integration/
│   └── stripe/
└── e2e/
    └── payment-flows/
```

### **Test Commands**
```bash
# Run all tests
npm test

# Run specific test file
npm test PaymentMethodsManager.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### **Common Test Patterns**
```typescript
// Component testing
import { render, screen, fireEvent } from '@testing-library/react';

// API testing
import { createMocks } from 'node-mocks-http';

// Stripe testing
import { stripe } from '@/libs/stripe/stripe-admin';
jest.mock('@/libs/stripe/stripe-admin');
```

---

## 🚨 **Common Issues & Solutions**

### **Stripe Integration Issues**
```typescript
// Issue: Stripe Elements not loading
// Solution: Ensure Stripe is loaded before rendering Elements
const [stripeLoaded, setStripeLoaded] = useState(false);

// Issue: Payment method creation fails
// Solution: Check Stripe publishable key and network connectivity

// Issue: Webhook signature verification fails
// Solution: Verify webhook secret and request body handling
```

### **TypeScript Issues**
```typescript
// Issue: Stripe types not found
// Solution: Install @stripe/stripe-js types
npm install --save-dev @types/stripe

// Issue: Component prop types
// Solution: Define proper interfaces
interface PaymentMethodProps {
  paymentMethod: Stripe.PaymentMethod;
  onDelete: (id: string) => void;
}
```

### **Styling Issues**
```css
/* Issue: Mobile layout breaks */
/* Solution: Use mobile-first responsive design */
.payment-container {
  /* Mobile styles first */
}

/* Issue: Touch targets too small */
/* Solution: Ensure minimum 44px touch targets */
.button {
  min-height: 44px;
  min-width: 44px;
}
```

---

## 📊 **Performance Monitoring**

### **Key Metrics to Watch**
- Page load time < 2 seconds
- API response time < 500ms
- Stripe Elements load time < 1 second
- Mobile performance score > 90

### **Monitoring Tools**
- Browser DevTools Performance tab
- Lighthouse for performance audits
- Network tab for API monitoring
- Stripe Dashboard for payment monitoring

---

## 🔗 **Useful Links**

### **Documentation**
- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### **Internal Resources**
- [Design System Specification](../design-system-specification.md)
- [API Documentation](../api-specs.md)
- [Testing Strategy](../testing-strategy.md)

### **Stripe Resources**
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)

---

## 📞 **Team Contacts**

### **Key Roles**
- **Technical Lead**: Implementation oversight and architecture decisions
- **Product Owner**: Requirements clarification and acceptance criteria
- **QA Engineer**: Testing strategy and quality assurance
- **DevOps**: Deployment and infrastructure support

### **Communication Channels**
- **Daily Standups**: 9:00 AM daily
- **Slack**: #stripe-integration channel
- **Emergency**: Direct message technical lead
- **Code Reviews**: GitHub pull requests

---

## ✅ **Daily Checklist**

### **Before Starting Work**
- [ ] Pull latest changes from main branch
- [ ] Check for any blockers or dependencies
- [ ] Review current sprint progress
- [ ] Update local environment if needed

### **During Development**
- [ ] Write tests for new functionality
- [ ] Follow security best practices
- [ ] Test on mobile devices
- [ ] Update documentation as needed

### **Before Committing**
- [ ] Run all tests locally
- [ ] Check TypeScript compilation
- [ ] Run linting
- [ ] Test payment flows manually
- [ ] Write descriptive commit messages

### **End of Day**
- [ ] Push work to feature branch
- [ ] Update sprint tracking
- [ ] Note any blockers for tomorrow
- [ ] Prepare for next day's standup

---

**Last Updated**: 2025-08-01  
**Quick Access**: Bookmark this page for daily reference  
**Questions**: Ask in #stripe-integration Slack channel
