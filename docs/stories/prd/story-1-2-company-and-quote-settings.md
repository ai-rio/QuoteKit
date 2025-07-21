# Story 1.2: Company and Quote Settings

As a logged-in user,  
I want to enter my company details and professional settings,  
so that my quotes are automatically branded and calculated correctly.  

## Acceptance Criteria

1. A logged-in user can access a dedicated "Settings" page.  
2. On the settings page, a user can input and save their company name, address, and phone number.  
3. A user can upload and save their company logo. The system should display the currently saved logo.  
4. A user can input and save a default tax rate as a percentage (e.g., 8.25%). The input field should only accept valid numeric values.  
5. A user can input and save a default profit markup as a percentage (e.g., 20%). The input field should only accept valid numeric values.  
6. All saved settings (company info, logo, tax, and markup) are successfully persisted in the database for that user.  
7. When a user creates a new quote, the system will use these saved values as the defaults.