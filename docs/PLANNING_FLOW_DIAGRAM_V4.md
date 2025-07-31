### Final User Flow (Version 4)

This diagram removes the "No Subscription" path from the account page, as it's an invalid state for a logged-in user. The primary user acquisition flow is now correctly rooted in the `/pricing` page.

```mermaid
graph TD
    subgraph "User Acquisition Flow (Unauthenticated)"
        A[Visitor lands on /pricing] --> B{User selects a plan};
        B --> C[Redirect to /auth/sign-up with plan info];
        C --> D[User completes sign-up];
        D --> E{Is selected plan Free?};
        E -- "Yes" --> F[Server Action creates Free Subscription record];
        E -- "No (Paid)" --> G[Redirect to /checkout page];
        G --> H[Webhook creates Paid Subscription record];
        F --> I[Redirect to /account];
        H --> I;
    end

    subgraph "Account Management Flow (Authenticated User)"
        J[User visits /account page] --> K{Subscription Status?};
        K -- "Free Plan" --> L[Display 'Upgrade Plan' button];
        L --> M[Open PlanChangeDialog];
        K -- "Paid Plan" --> N[Display 'Change Plan' button];
        N --> M;
    end
```

### Explanation of the Final Flow:

1.  **User Acquisition (`/pricing`)**: The only way for a user to get a subscription is by starting on the `/pricing` page. After signing up, a subscription record (either free or paid) is **always** created for them.
2.  **Account Management (`/account`)**: This page is exclusively for users who already have a subscription.
    *   If they are on a **Free Plan**, they see an "Upgrade Plan" button which opens the `PlanChangeDialog`.
    *   If they are on a **Paid Plan**, they see a "Change Plan" button which also opens the `PlanChangeDialog`.

This model is clean, accurate, and reflects the logic you've described.