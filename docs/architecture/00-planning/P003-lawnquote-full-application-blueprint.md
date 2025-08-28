# **LawnQuote \- Full Application Blueprint**

Project: LawnQuote Software  
Brand Identity: The Pro-Grade Kit  
Guiding Principles: Speed, Simplicity, Clarity, Confidence, and Trustworthiness.

## **1\. Brand & Visual Identity**

This section outlines the core visual elements that define the LawnQuote brand across all assets.

* **Vibe:** A premium, indispensable part of a modern landscaper's toolkit. Clean, trustworthy, and professional-grade.  
* **Logo:** The "Initial Stack" \- A bold, confident monogram of the letters "L" and "Q" that feels like a stamp of quality.  
* **Color Palette:**  
  * **Primary:** Forest Green (\#2A3D2F)  
  * **Secondary:** Stone Gray (\#D7D7D7)  
  * **Accent:** Equipment Yellow (\#F2B705)  
  * **Neutral:** Light Concrete (\#F5F5F5)  
  * **Text:** Charcoal (\#1C1C1C)  
* **Typography:**  
  * **Headlines/Logotype:** Inter (Bold)  
  * **Body Text:** Inter (Regular)  
  * **Data/UI Numerals:** Roboto Mono (Medium)

## **2\. Public-Facing & Authentication Pages**

This section covers the user's first interaction with the brand, from the marketing site to gaining access to the application.

### **2.1. Marketing Landing Page**

* **Objective:** To clearly communicate the value proposition and convert visitors into free users.  
* **Structure:**  
  1. **Hero Section:** Headline "The 5-Minute Landscaping Quote." with a prominent "Start for Free" CTA.  
  2. **Problem/Solution:** "Before & After" comparison of messy notes vs. a professional LawnQuote PDF.  
  3. **How It Works:** Simple 3-step graphic (Set Up Items → Create Quote → Download PDF).  
  4. **Core Features:** Minimalist icons for key features.  
  5. **Pricing Teaser:** Clear breakdown of Free vs. Pro tiers to encourage sign-ups.

### **2.2. Authentication (Sign-Up & Login)**

* **Layout:** A clean, centered form with the LawnQuote logo displayed prominently above.  
* **Sign-Up Page:**  
  * **Title:** "Create Your Account"  
  * **Fields:** Full Name, Email Address, Password.  
  * **CTA:** "Sign Up for Free" (Equipment Yellow).  
  * **Footer:** Link to the Login page.  
* **Login Page:**  
  * **Title:** "Welcome Back"  
  * **Fields:** Email Address, Password.  
  * **CTA:** "Login" (Forest Green).  
  * **Footer:** Link to the Sign-Up page.

## **3\. Core Application UI**

This section details the design of the main application once a user is logged in.

### **3.1. Overall Layout & Navigation**

* **Structure:** A persistent sidebar navigation on the left with the main content area on the right.  
* **Sidebar Components:**  
  * LawnQuote Logo and Name.  
  * Navigation Links: "Quotes," "Item Library," "Settings."  
  * Logout button at the bottom.

### **3.2. Quote Workspace**

* **Objective:** Allow a user to create an accurate, professional quote as quickly as possible.  
* **Header:** Page title ("New Quote") and primary actions ("Save Draft," "Generate PDF").  
* **Client Details Card:** Form for Client Name, Address, Quote \#, and Date.  
* **Line Items Card:**  
  * **Header:** "Line Items" title and an "Add Item" button (Equipment Yellow).  
  * **Table:** Columns for ITEM, QTY, PRICE, TOTAL.  
  * **Totals Section:** Right-aligned section for Subtotal, Tax, and the final Total (large, bold, Forest Green).

### **3.3. Item Library**

* **Objective:** Allow users to manage a personal database of services and materials to speed up future quote creation.  
* **Header:** "Item Library" title and a primary "Add New Item" button (Equipment Yellow).  
* **Item List:** A clean table with columns for ITEM NAME, UNIT, COST / PRICE, and ACTIONS (Edit/Delete).  
* **Empty State:** A helpful prompt for new users to add their first item.  
* **Functionality:** Inline editing for simplicity.

### **3.4. Settings**

* **Objective:** A simple, one-time setup for users to configure their company and financial details.  
* **Header:** "Settings" title and a "Save Changes" button that is only active when changes are made.  
* **Company Profile Card:** Inputs for Company Name, Address, Phone, Email, and a Logo Upload.  
* **Financial Defaults Card:** Inputs for Default Tax Rate (%) and Default Profit Markup (%).

## **4\. Final Output: PDF Quote Template**

This section defines the structure of the primary deliverable for the user's clients.

* **Header:** Two-column layout with the user's company logo and info on the left, and "QUOTE," quote number, and date on the right.  
* **Client Info:** A "PREPARED FOR" section with the client's name and address.  
* **Line Items Table:** A clean, structured table with a Stone Gray header and alternating row colors for readability. All financial numbers use Roboto Mono.  
* **Totals:** A right-aligned block for Subtotal, Tax, and the final, emphasized Total.  
* **Notes/Terms:** An optional text block for notes or terms of service.  
* **Footer:** A subtle "Quote generated with LawnQuote" for Free tier users (removed for Pro).