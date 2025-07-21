# **LawnQuote Software Product Requirements Document (PRD)**

| Date | Version | Description | Author |
| :---- | :---- | :---- | :---- |
| 2025-07-21 | 1.0 | Initial PRD draft | John, PM |

## **1.0 Goals and Background Context**

### **1.1 Goals**

The primary goals of this project are to:

* Enable a solo landscaper to create and generate a professional, accurate quote in under 10 minutes.  
* Establish LawnQuote Software as the go-to, entry-level quoting tool for new and early-stage landscaping businesses.  
* Achieve a Monthly Recurring Revenue (MRR) of approximately $2,424 within the first six months of launch.

### **1.2 Background Context**

Solo landscaping operators currently rely on inefficient and error-prone manual methods for generating quotes, such as spreadsheets or pen and paper. This process is a significant administrative burden for tradespeople whose expertise is in fieldwork, not office administration. LawnQuote Software will solve this problem by providing a hyper-focused, simple-to-use tool that automates calculations and produces professional PDF quotes, allowing users to save time and win more jobs.

## **2.0 Requirements**

### **2.1 Functional**

* **FR1:** The system shall allow a new user to create an account using an email address and password.  
* **FR2:** The system shall allow a logged-in user to enter and save their company information, including name, address, phone number, and a logo image.  
* **FR3:** The system shall provide an interface for a user to create, view, update, and delete a personal database of their services and materials (line items), each with a name, unit (e.g., "hour", "sq ft"), and cost.  
* **FR4:** The system shall allow a user to set and save default values for tax rate and profit markup percentage in their settings.  
* **FR5:** The system shall provide a primary interface where a user can create a new quote by adding line items from their database and specifying quantities.  
* **FR6:** The quote creation interface must automatically calculate the subtotal, tax, and final total in real-time as line items are added or modified, based on the user's saved default rates.  
* **FR7:** The system shall allow a user to override the default tax and profit markup rates for any individual quote.  
* **FR8:** The system shall generate a professional, formatted PDF of the completed quote, including the user's company information and logo, client details, and an itemized list of services/materials.  
* **FR9:** The system shall allow the user to download the generated PDF to their device.

### **2.2 Non-Functional**

* **NFR1:** The application must be fully responsive and usable on both desktop and mobile web browsers.  
* **NFR2:** All user inputs must be validated to prevent errors (e.g., ensuring costs are numeric, email addresses are in a valid format).  
* **NFR3:** The application pages should load quickly, targeting a Google PageSpeed Insights score of 90+ for mobile.  
* **NFR4:** The application must be secure, protecting user account information and their private business data (client lists, pricing).  
* **NFR5:** The user interface must be intuitive and require minimal to no instruction for a user to complete the core workflow of creating a quote.

## **3.0 User Interface Design Goals**

### **3.1 Overall UX Vision**

The user experience will be guided by one principle: **radical simplicity**. The application should feel like a simple, powerful tool, not a complex piece of software. The goal is to make the process of creating a professional quote faster and easier than using a spreadsheet. We will prioritize clarity and speed over feature density at every decision point.

### **3.2 Key Interaction Paradigms**

* **Linear Workflow:** The user will be guided through a clear, step-by-step process: Settings \-\> My Items \-\> Create Quote \-\> Generate PDF.  
* **Real-time Calculation:** The quote total will update instantly with every change, providing immediate feedback.  
* **Minimal Data Entry:** The "My Items" database is key. Once set up, creating a quote should primarily involve selecting items and entering quantities, minimizing typing.

### **3.3 Core Screens and Views**

From a product perspective, the MVP requires the following conceptual screens:

* **Login/Sign-Up Screen**  
* **Initial Setup / Settings Page**  
* **"My Items" Database Management Page**  
* **"Create Quote" Calculator Page**

### **3.4 Accessibility**

* **Standard:** WCAG AA. The application must be accessible, with sufficient color contrast and keyboard navigability.

### **3.5 Branding**

* The UI will be clean, professional, and trustworthy. It will allow users to upload their own logo, which will be prominently displayed on the generated PDF to reinforce their brand, not ours.  
* **Component Library:** The application will heavily utilize shadcn/ui components to ensure a consistent, accessible, and professional look and feel out-of-the-box, accelerating development while maintaining a high standard of quality.

### **3.6 Target Device and Platforms**

* **Target:** Web Responsive. The application must be fully functional and easy to use on both mobile devices (for on-the-go quoting) and desktop computers (for office-based setup).

## **4.0 Technical Assumptions**

### **4.1 Repository Structure**

* **Repository Structure:** Single Application Repository. The project will be managed within one cohesive Next.js application repository.

### **4.2 Service Architecture**

* **Service Architecture:** Serverless. We will leverage a serverless architecture, using Next.js for API routes and Supabase for managed backend services like database and authentication. This aligns with the goal of a low-maintenance, scalable, and cost-efficient solution.

### **4.3 Testing Requirements**

* **Testing Requirements:** A pragmatic, test-supported development strategy will be adopted. We will prioritize writing unit and integration tests for critical business logic, primarily the quote calculation engine and API boundary interactions (Supabase, Stripe). Lighter testing will be applied to UI components to ensure speed and flexibility during the MVP phase.

### **4.4 Additional Technical Assumptions and Requests**

* The project will be built using the stack defined in the README.md: Next.js 15, Supabase, Stripe, React Email, Resend, Tailwind CSS, and shadcn/ui.  
* Deployment will be handled via Vercel, leveraging its seamless integration with Next.js.  
* Database schema management will be handled through Supabase migrations.  
* Initial product and pricing data will be seeded using the provided Stripe fixture.

## **5.0 Epic and Story Breakdown**

### **Epic 1: Foundational Setup & Core Quoting Workflow**

This epic will deliver the full end-to-end user journey required for the MVP, establishing the complete application foundation from user sign-up to the generation of a downloadable PDF quote.

#### **Story 1.1: User Sign-Up and Login**

As a new user,  
I want to be able to sign up for an account and log in,  
so that I can access the application and secure my data.  
**Acceptance Criteria:**

1. A user can navigate to a sign-up page from the main landing page.  
2. A user can create a new account using a valid email and a password.  
3. The system validates that the email provided is in a proper format.  
4. The system validates that the password meets minimum security requirements (e.g., minimum length).  
5. Upon successful sign-up, the user is automatically logged in and redirected to the main application dashboard or an initial setup screen.  
6. A returning user can navigate to a login page.  
7. A returning user can log in with their correct email and password.  
8. The system provides a clear error message if login credentials are incorrect.  
9. A logged-in user has a clear way to log out of the application.

#### **Story 1.2: Company and Quote Settings**

As a logged-in user,  
I want to enter my company details and professional settings,  
so that my quotes are automatically branded and calculated correctly.  
**Acceptance Criteria:**

1. A logged-in user can access a dedicated "Settings" page.  
2. On the settings page, a user can input and save their company name, address, and phone number.  
3. A user can upload and save their company logo. The system should display the currently saved logo.  
4. A user can input and save a default tax rate as a percentage (e.g., 8.25%). The input field should only accept valid numeric values.  
5. A user can input and save a default profit markup as a percentage (e.g., 20%). The input field should only accept valid numeric values.  
6. All saved settings (company info, logo, tax, and markup) are successfully persisted in the database for that user.  
7. When a user creates a new quote, the system will use these saved values as the defaults.

#### **Story 1.3: Manage Service and Material Items**

As a logged-in user,  
I want to create and manage a database of my services and materials,  
so that I can quickly add them to new quotes without re-typing information.  
**Acceptance Criteria:**

1. A logged-in user can access a dedicated page, "My Items," to manage their services and materials.  
2. The user can add a new item to their database.  
3. The form for adding a new item must include fields for: Item Name (e.g., "Mulch Installation"), Unit (e.g., "cubic yard"), and Cost/Rate per unit.  
4. The system saves the new item to the user's personal database.  
5. The "My Items" page displays a list of all previously saved items.  
6. The user can edit the name, unit, or cost of any existing item in the list.  
7. The user can delete an item from their database.  
8. When using the quote calculator, the user can select from this list of saved items to add them to a quote.

#### **Story 1.4: Create and Calculate a Quote**

As a logged-in user,  
I want to create a new quote by adding my items and specifying quantities,  
so that the system can automatically and accurately calculate the total price for my client.  
**Acceptance Criteria:**

1. From the main dashboard, a user can start creating a new quote.  
2. The user can add a field for their client's name and contact information.  
3. The user can select items from their "My Items" database to add them as line items to the quote.  
4. For each line item added, the user must specify a quantity.  
5. As quantities are entered or changed, the line item total and the overall quote subtotal update in real-time.  
6. The quote automatically applies the user's default tax and profit markup percentages (from Story 1.2) to the subtotal to calculate the final total.  
7. The user has the option to manually override the default tax and markup percentages for this specific quote without changing their global settings.  
8. If the user overrides the defaults, the final total recalculates in real-time.  
9. The user can remove line items from the quote.

#### **Story 1.5: Generate and Download Quote PDF**

As a logged-in user,  
I want to generate a professional PDF of my completed quote,  
so that I can download it and send it to my client.  
**Acceptance Criteria:**

1. On the "Create Quote" page, there is a clear and prominent button labeled "Generate PDF" or similar.  
2. Clicking the button triggers the generation of a PDF document.  
3. The generated PDF must be professionally formatted and include:  
   * The user's company name, logo, and contact information (from Story 1.2).  
   * The client's name and contact information (from Story 1.4).  
   * An itemized list of all services/materials with quantities, unit prices, and line totals.  
   * A clear breakdown of the subtotal, tax amount, and the final total.  
4. The system should not include the user's internal profit markup on the client-facing PDF.  
5. Upon successful generation, the user's browser prompts them to download the PDF file.  
6. The downloaded file is a valid, non-corrupted PDF that can be opened by standard PDF readers.