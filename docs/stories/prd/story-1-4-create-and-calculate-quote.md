# Story 1.4: Create and Calculate a Quote

As a logged-in user,  
I want to create a new quote by adding my items and specifying quantities,  
so that the system can automatically and accurately calculate the total price for my client.  

## Acceptance Criteria

1. From the main dashboard, a user can start creating a new quote.  
2. The user can add a field for their client's name and contact information.  
3. The user can select items from their "My Items" database to add them as line items to the quote.  
4. For each line item added, the user must specify a quantity.  
5. As quantities are entered or changed, the line item total and the overall quote subtotal update in real-time.  
6. The quote automatically applies the user's default tax and profit markup percentages (from Story 1.2) to the subtotal to calculate the final total.  
7. The user has the option to manually override the default tax and markup percentages for this specific quote without changing their global settings.  
8. If the user overrides the defaults, the final total recalculates in real-time.  
9. The user can remove line items from the quote.