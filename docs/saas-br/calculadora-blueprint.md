
# **Technical Blueprint: MVP for the "Calculadora Avançada de Precificação e Lucro"**

### **Introduction**

This document presents the definitive technical blueprint and development guide for the Minimum Viable Product (MVP) of the "Calculadora Avançada de Precificação e Lucro para Vendedores do Mercado Livre". It is designed to serve as a complete and practical roadmap for the development team, translating the business opportunity identified in the 'Análise de Oportunidades Micro-SaaS para Nichos Mal Atendidos no Mercado Brasileiro' into an actionable technical plan. The core of this solution lies in its direct, real-time integration with the Mercado Livre API, which provides a significant and defensible competitive advantage over existing static solutions. This blueprint details the recommended architecture, technology stack, user flows, a comprehensive API integration strategy, the core calculation logic, and a phased development roadmap to ensure a rapid and successful MVP launch.

---

## **1\. Project Overview & Core Objective**

This section establishes the foundational business context that informs all subsequent technical decisions. A clear understanding of the project's goal and its value to the end-user is paramount to ensuring the development effort remains focused on solving the primary pain point.

### **1.1. Primary Goal**

The primary goal of this project is to architect, develop, and deploy a web-based Micro-SaaS application that provides Mercado Livre (ML) sellers in Brazil with a real-time, API-driven tool to accurately calculate net profit and profit margin for their products. The application will serve as a single source of truth for pricing decisions, empowering sellers to optimize their profitability with confidence.

### **1.2. Core Value Proposition**

The application's core value proposition is **Accuracy through Automation**. It directly addresses the significant challenge sellers face when navigating Mercado Livre's complex and dynamic fee structure, which includes variable commissions, conditional fixed fees, and seller-specific shipping costs.1

The value of the application extends beyond simple calculation; it must establish itself as a source of financial truth for the seller. Many sellers currently lose money not from a lack of tools, but from a lack of trustworthy, real-time data. Static spreadsheets and generic online calculators are inherently prone to error, as they cannot account for the frequent changes in ML's fee policies or the seller-specific variables that impact cost.

By integrating directly with the Mercado Livre API, the tool fetches real-time, user-specific data, offering a substantial improvement in accuracy and reliability. This direct API link is the application's unique selling proposition. Therefore, the user is not merely purchasing a calculation; they are investing in financial confidence and the elimination of anxiety associated with pricing uncertainty. This understanding must inform every aspect of the product, from user interface copy to the resilience of the backend architecture. The system must be built on a foundation of robustness, as any failure that results in an incorrect calculation would irrevocably damage this core user trust.

---

## **2\. Proposed Architecture & Technology Stack**

The selection of an appropriate architecture and technology stack is critical for a Micro-SaaS MVP. The following recommendations are optimized for development velocity, low initial operating costs, and sufficient scalability for future growth.

### **2.1. Architectural Philosophy: A Serverless-First, Monorepo Approach**

A **serverless architecture** is recommended for this project. This approach abstracts away the complexities of infrastructure management, such as provisioning servers, managing operating systems, and handling load balancing. For an MVP with potentially unpredictable traffic, this model is highly cost-effective, as it operates on a pay-as-you-go basis, and it allows the development team to focus exclusively on writing application code.2

The frontend and backend code will be managed within a **single Git repository (a monorepo)**. This strategy streamlines the development workflow, simplifies dependency management across the full stack, and enables unified deployment processes. It is particularly well-suited for a small team or solo developer, as it reduces the cognitive overhead of managing multiple repositories and build pipelines.

### **2.2. Recommended Technology Stack**

The chosen technology stack creates a symbiotic ecosystem that maximizes development velocity. The combination of a lightweight frontend, a serverless backend, a serverless database, and a unified deployment platform means a developer never has to engage with traditional infrastructure tasks like server or database provisioning. This is a strategic choice to focus 100% of the MVP's limited development resources on feature implementation, which is the most critical factor for a successful launch.

| Layer | Technology | Primary Justification |
| :---- | :---- | :---- |
| Frontend | Vue.js | Rapid development, ease of learning, ideal for interactive UIs. |
| Backend | Node.js with Express.js | Excellent for I/O-bound tasks (API calls), large ecosystem. |
| Database | Google Firestore | Serverless, easy setup, generous free tier, fits MVP data model. |
| Deployment | Vercel | Seamless monorepo support, zero-config serverless functions. |

#### **2.2.1. Frontend: Vue.js**

Vue.js is recommended for the frontend. It is a progressive JavaScript framework celebrated for its simplicity, gentle learning curve, and rapid development speed, making it an ideal choice for startups and MVPs.4 Its straightforward template syntax, well-defined component structure, and built-in reactivity system will enable a developer to quickly build the interactive calculator interface required for this application. While React has a larger community, Vue's design often allows for faster onboarding and delivery of functional UIs, which is a key advantage for a project of this scale.6

#### **2.2.2. Backend: Node.js with Express.js**

Node.js with the Express.js framework is the recommended choice for the backend. Express.js is a minimalist, unopinionated, and highly robust framework that provides all the necessary tools for creating the API endpoints required for the OAuth flow and for proxying requests to the Mercado Livre API.7 The asynchronous, non-blocking I/O model of Node.js is exceptionally well-suited for an application that is primarily I/O-bound—that is, an application whose primary function is to make and wait for external API calls. This ensures the backend remains performant and responsive even while communicating with Mercado Livre's servers.9 The vast npm ecosystem also provides battle-tested libraries for every required task, from making HTTP requests (

axios) to data encryption.

#### **2.2.3. Database: Google Firestore**

For the MVP's data storage needs—primarily user profiles and their associated encrypted OAuth tokens—Google Firestore is the optimal choice. As a NoSQL, serverless document database, Firestore is perfectly suited for storing this type of flexible, JSON-like data without the need to define a rigid schema upfront.10 Its serverless nature aligns perfectly with the overall architectural philosophy, completely eliminating database administration overhead. Furthermore, Firestore offers a generous free tier, advanced querying capabilities, and high reliability, making it the fastest and most cost-effective path to a functional backend for the MVP.12

#### **2.2.4. Deployment: Vercel**

Vercel is the recommended deployment platform for both the frontend and backend. Vercel is purpose-built for modern frontend frameworks and serverless functions, providing a seamless, Git-based workflow.2 It offers automatic deployments on every

git push, a global edge network for fast frontend delivery, and, most importantly, first-class native support for Node.js/Express.js serverless functions. This critical feature allows the entire application—both the Vue.js frontend and the Express.js backend—to be deployed and managed from a single platform with zero configuration, perfectly complementing the monorepo strategy.3

---

## **3\. Detailed User Flow & System Interaction**

This section provides a narrative, step-by-step walkthrough of the complete user journey. This flow serves as a functional requirements document for the UI/UX and frontend development, outlining each critical interaction between the user and the application.

### **3.1. The User Journey: A Step-by-Step Narrative**

1. **Landing, Value Proposition, and Registration:** The user arrives at the application's landing page. The page's primary headline and sub-headline must clearly and concisely communicate the core value proposition: "Stop guessing. Calculate your real Mercado Livre profit with 100% API-verified accuracy." A prominent call-to-action (CTA) button, labeled "Create a Free Account," will be the main focus. Clicking this button leads to a simple registration form where the user provides an email and password. Upon submission, a new user record is created in the Firestore database.  
2. **Onboarding and Initiating Mercado Livre Connection:** Upon their first successful login, the user is immediately directed to a simple, focused onboarding screen. This screen will have a single objective: to prompt the user to connect their Mercado Livre account. A large, clearly labeled button will read "Connect with Mercado Livre." Accompanying text will briefly explain that this connection is secure and necessary to fetch real-time fee and shipping data.  
3. **The OAuth 2.0 Authorization Redirect:** When the user clicks the "Connect with Mercado Livre" button, the frontend makes a request to a dedicated backend endpoint (e.g., /api/auth/redirect). This backend endpoint constructs the official Mercado Livre authorization URL and redirects the user's browser to it. This URL must include the application's client\_id, the requested scopes (read and offline\_access), the response\_type=code, and the redirect\_uri that points back to the application's callback endpoint.14 The user is now on the Mercado Livre website and is prompted to log in (if not already) and grant the application permission to access their data.  
4. **Secure Token Exchange and User Session Creation:** After the user approves the permissions, Mercado Livre redirects their browser back to the redirect\_uri specified in the previous step (e.g., /api/auth/callback). This redirect includes a temporary, single-use authorization\_code in the URL's query parameters.15 The application's backend server receives this request, extracts the  
   code, and immediately makes a secure, server-to-server POST request to the Mercado Livre token endpoint (https://api.mercadolibre.com/oauth/token). This request exchanges the code for a long-lived access\_token and a refresh\_token.15 These tokens are then immediately encrypted using a strong symmetric encryption algorithm and stored securely in the user's document within the Firestore database. Once the tokens are saved, the user is considered fully authenticated and is redirected to the main calculator dashboard.  
5. **The Interactive Calculator Interface:** The user is now presented with the core tool. The interface will be clean and intuitive, featuring the following input fields:  
   * "Preço de Venda (R$)"  
   * "Custo do Produto (R$)"  
   * "Outros Custos (Opcional, R$)"  
   * A dropdown menu to select "Tipo de Anúncio" (e.g., Clássico, Premium).  
   * A searchable dropdown or modal for selecting the product's "Categoria". This will be populated by a call to the ML API.  
   * For the MVP, a field to input an item\_id of a similar product to estimate shipping costs accurately.  
6. **Displaying the Comprehensive Profit Analysis:** The calculator will be highly interactive. As the user types in the "Preço de Venda" and selects other options, the frontend will make real-time requests to the backend. The backend, using the user's stored access\_token, will call the necessary ML APIs to fetch the relevant fees and costs. The results will be displayed instantly in a clear, easy-to-read summary panel, breaking down the entire financial picture:  
   * Preço de Venda  
   * (-) Custo do Produto  
   * (-) Comissão do ML (showing both percentage and calculated value)  
   * (-) Taxa Fixa do ML (conditionally displayed)  
   * (-) Custo do Frete (pago pelo vendedor)  
   * (-) Outros Custos  
   * **(=) Lucro Líquido (R$)**  
   * **Margem de Lucro (%)**

---

## **4\. Mercado Livre API Integration: The Core Blueprint**

This section provides the most critical technical details for the project. It is a practical guide for the developer on registering the application, handling the secure authentication flow, and interacting with the specific Mercado Livre API endpoints required for the calculator's functionality.

### **4.1. Getting Started: Application Registration in the Developer Portal**

Before any code can be written, the application must be registered with Mercado Livre. This process generates the credentials needed to interact with the API.

1. Navigate to the Mercado Livre Developers portal (https://developers.mercadolibre.com.br/) and log in with a Mercado Livre account.  
2. Locate and click the option to "Create new application."  
3. Fill in the required application details:  
   * **Name:** A user-facing name for the application (e.g., "Calculadora de Lucro Pro").  
   * **Short name:** An internal name used for URLs.  
   * **Description:** A brief summary of the application's purpose.  
4. Configure the following crucial settings 14:  
   * **Redirect URI:** This field is mandatory and security-critical. It must be the absolute URL of the backend's OAuth callback endpoint. For the proposed stack, this will be https://\<your-app-name\>.vercel.app/api/auth/callback. The URL **must** use HTTPS.  
   * **Scopes:** The application must request the correct permissions to function. Select the following scopes:  
     * read: Allows the application to use GET methods to retrieve information about the user, fees, categories, and other necessary data.16  
     * offline\_access: This scope is **non-negotiable** for this application. It instructs the API to provide a refresh\_token along with the access\_token. This enables the application to make API calls on the user's behalf even when they are not actively logged in, which is essential for maintaining a seamless user experience and for any future automated features.14  
5. Accept the terms and conditions and save the application. Upon creation, the portal will display the application's App ID (also known as Client ID) and Secret Key (Client Secret). These credentials must be stored securely as environment variables in the backend server's configuration (e.g., in Vercel's environment variable settings). They must never be exposed in the frontend code or committed to version control.

### **4.2. Secure Authentication (OAuth 2.0): Server-Side Implementation**

The OAuth 2.0 flow must be handled entirely on the server-side (the Express.js backend) to protect the application's Secret Key. The browser should never have access to this credential.15

#### **4.2.1. Implementation Example: The Callback Route in Node.js**

The following code snippet demonstrates how to implement the /api/auth/callback route using Node.js, Express.js, and the axios library. This route is responsible for the final step of the OAuth 2.0 flow: exchanging the authorization code for the access and refresh tokens.

JavaScript

// File: /api/auth/callback.js  
const express \= require('express');  
const axios \= require('axios');  
const querystring \= require('querystring');  
// Assume a utility function for secure storage  
// const { saveUserTokens } \= require('../../utils/firestore'); 

const router \= express.Router();

router.get('/', async (req, res) \=\> {  
  const { code, state } \= req.query; // 'state' can be used for CSRF protection

  if (\!code) {  
    return res.status(400).send('Error: Authorization code not found.');  
  }

  // It's good practice to validate the 'state' parameter here against a value  
  // stored in the user's session to prevent CSRF attacks.

  const tokenUrl \= 'https://api.mercadolibre.com/oauth/token';  
    
  const requestBody \= {  
    grant\_type: 'authorization\_code',  
    client\_id: process.env.MERCADO\_LIVRE\_APP\_ID,  
    client\_secret: process.env.MERCADO\_LIVRE\_SECRET\_KEY,  
    code: code,  
    redirect\_uri: process.env.MERCADO\_LIVRE\_REDIRECT\_URI,  
  };

  try {  
    const response \= await axios.post(tokenUrl, querystring.stringify(requestBody), {  
      headers: {  
        'Accept': 'application/json',  
        'Content-Type': 'application/x-www-form-urlencoded',  
      },  
    });

    const { access\_token, refresh\_token, user\_id, expires\_in } \= response.data;  
      
    // TODO: Securely store the tokens in the database.  
    // The tokens MUST be encrypted before being stored.  
    // await saveUserTokens(req.session.userId, { access\_token, refresh\_token, user\_id, expires\_in });

    // Redirect the user to the application's dashboard  
    res.redirect('/dashboard');

  } catch (error) {  
    console.error('Error exchanging authorization code for token:', error.response? error.response.data : error.message);  
    res.status(500).send('An error occurred during authentication.');  
  }  
});

module.exports \= router;

### **4.3. Core API Endpoint Analysis for Profit Calculation**

To perform an accurate profit calculation, the application must orchestrate calls to several distinct API endpoints. The profitability of an item is highly contextual, depending on price, listing type, category, and shipping profile. This sequence of API calls is necessary to gather this context.

| Purpose | HTTP Method & URL | Key Data Points Retrieved |
| :---- | :---- | :---- |
| Get Seller Profile | GET /users/{user\_id} | id, nickname, country\_id |
| Get Listing Type Fees | GET /sites/MLB/listing\_prices?price={price} | listing\_type\_id, sale\_fee\_amount |
| Get Category Commission | GET /sites/MLB/listing\_prices?price={p}\&category\_id={c} | sale\_fee\_details.percentage\_fee |
| Calculate Shipping Cost | GET /users/{user\_id}/shipping\_options?item\_id={item\_id} | cost, list\_cost |

#### **4.3.1. Endpoint 1: Get Seller's Profile**

* **Method & URL:** GET https://api.mercadolibre.com/users/{user\_id} 18  
* **Purpose:** This is the first call made after successful authentication. Its primary purpose is to retrieve basic profile information and, crucially, to verify that the user's account is based in the target country (country\_id: "BR"). The {user\_id} is obtained from the OAuth token exchange response.17  
* **JSON Response Snippet:**  
  JSON  
  {  
    "id": 123456789,  
    "nickname": "VENDEDOR\_EXEMPLO",  
    "registration\_date": "2020-01-15T10:30:00.000-03:00",  
    "country\_id": "BR",  
    "user\_type": "normal",  
    "points": 1250,  
    "site\_id": "MLB"  
  }

#### **4.3.2. Endpoint 2: Get Listing Type Fees**

* **Method & URL:** GET https://api.mercadolibre.com/sites/MLB/listing\_prices?price={price} 20  
* **Purpose:** This endpoint is used to fetch the base commission (sale\_fee\_amount) for different listing types (e.g., gold\_special for Clássico, gold\_pro for Premium) based on the selling price provided by the user. This allows the calculator to dynamically update the fees when the user toggles between listing types in the UI.  
* **JSON Response Snippet (Illustrative for MLB):**  
  JSON

#### **4.3.3. Endpoint 3: Get Category-Specific Commission**

* **Method & URL:** GET https://api.mercadolibre.com/sites/MLB/listing\_prices?price={price}\&category\_id={category\_id} 20  
* **Purpose:** Commission rates can vary significantly between product categories. To ensure maximum accuracy, this endpoint must be called after the user selects their product's category. The application should first fetch the category tree using GET /sites/MLB/categories to populate the selection UI.21  
* **JSON Response Snippet (Illustrative):**  
  JSON  
  [  
    {  
      "listing\_type\_id": "gold\_special",  
      "sale\_fee\_details": [  
        {  
          "percentage\_fee": 11.5, // Example of a category-specific commission rate  
          "meli\_percentage\_fee": 11.5  
        }  
      ],  
      "sale\_fee\_amount": 11.50  
    }  
  ]

#### **4.3.4. Endpoint 4: Calculate Shipping Costs**

* **Method & URL:** GET /users/{user\_id}/shipping\_options?item\_id={item\_id}\&zip\_code={zip\_code} (derived from 23)  
* **Purpose:** Calculating the seller's portion of the shipping cost is complex. It depends on the seller's reputation, Mercado Envios agreements, the item's dimensions and weight, and the buyer's location. The API does not provide a simple endpoint to calculate this cost based on dimensions alone. The most reliable method is to query the shipping options for an *existing, similar item*. For the MVP, the simplest approach is to require the user to input an item\_id of a product they sell that is representative of the one they are pricing. The zip\_code can be a sample from a major city (e.g., São Paulo's CEP) to get a representative cost.  
* **JSON Response Snippet:**  
  JSON  
  {  
    "options":  
  }

### **4.4. API Governance and Best Practices**

Adherence to API best practices is crucial for building a secure, reliable, and scalable application.

* **Token Refresh and Storage Strategy:**  
  * **Storage:** The access\_token and refresh\_token are highly sensitive credentials. They **must** be stored encrypted in the database (Firestore). A strong, standard symmetric encryption library, such as the crypto module in Node.js, should be used. The encryption key must be stored as a secure environment variable and never hardcoded.26  
  * **Refresh Logic:** The access\_token provided by Mercado Livre has a lifespan of 6 hours.15 The  
    refresh\_token is used to obtain a new access\_token without requiring the user to log in again. The backend must implement a robust refresh mechanism. Before making any API call, the application should check the token's expiration time. If it is close to expiring, the application must first execute the refresh flow by making a POST request to the token endpoint with grant\_type: 'refresh\_token'.15 Upon receiving the new  
    access\_token and the new refresh\_token, the application must update the encrypted values in the database before proceeding with the original API call. It is critical to note that refresh\_tokens are typically single-use; a new one is issued with each refresh.15  
* **Handling API Rate Limits:** Mercado Livre, like all major platforms, enforces rate limits on its API to ensure stability. The application must be designed to handle these limits gracefully. The recommended approach is to implement an **exponential backoff** strategy. If an API request fails with a 429 Too Many Requests status code, the application should wait for a short, randomized interval (e.g., 1-2 seconds) and then retry the request. If the request fails again, the waiting interval should be doubled for each subsequent attempt, up to a maximum number of retries.  
* **Robust Error Handling and Logging:** All external API calls must be wrapped in try...catch blocks to prevent unhandled exceptions from crashing the server. Any errors should be logged to a dedicated error monitoring service (e.g., Bugsnag, Sentry) with as much context as possible.28 Special attention must be paid to handling  
  401 Unauthorized and 403 Forbidden errors. These statuses typically indicate that the access\_token is invalid or has been revoked. When such an error is encountered, the application should automatically attempt to use the refresh\_token. If the refresh also fails, the system must flag the user's account as needing re-authentication and prompt them on their next visit to reconnect their Mercado Livre account.

---

## **5\. The Calculation Engine: Translating Fees into Logic**

The core of the application is the calculation engine. This backend component takes all the inputs gathered from the user and the API calls and applies the business logic to determine the final profit and margin. This section provides the precise specification for this logic.

### **5.1. Input Parameters for the Calculation**

The primary calculation function will require a set of well-defined inputs. The following table acts as a contract between the frontend (data collection) and the backend (calculation logic), ensuring all necessary data is passed correctly.

| Variable Name | Data Type | Source | Description |
| :---- | :---- | :---- | :---- |
| sellingPrice | Number | User Input | The final price the customer pays for the item. |
| productCost | Number | User Input | The seller's cost of goods sold (COGS). |
| otherCosts | Number | User Input (Optional) | Any additional per-unit costs like packaging, marketing, etc. |
| mlCommission | Number | API (listing\_prices) | The main commission fee from ML, calculated from the percentage rate. |
| mlFixedFee | Number | Business Logic | The conditional fixed fee applied to low-priced items. |
| shippingCost | Number | API (shipping\_options) | The portion of the shipping cost that is paid by the seller. |

### **5.2. Core Logic: The calculateProfit Pseudo-code**

The following pseudo-code outlines the step-by-step logic for the main profit calculation function. It is language-agnostic and should be implemented in the Node.js backend.

FUNCTION calculateProfit(sellingPrice, productCost, otherCosts, mlCommission, mlFixedFee, shippingCost)

  // Step 1: Calculate Gross Revenue from the sale.  
  // This is simply the selling price.  
  grossRevenue \= sellingPrice

  // Step 2: Sum all Mercado Livre fees.  
  // This includes the percentage-based commission and the conditional fixed fee.  
  totalMLFees \= mlCommission \+ mlFixedFee

  // Step 3: Sum all other costs.  
  // This includes the product's cost, seller-paid shipping, and any other miscellaneous costs.  
  totalDirectCosts \= productCost \+ shippingCost \+ otherCosts

  // Step 4: Calculate the final Net Profit.  
  // This is the revenue minus all fees and costs.  
  netProfit \= grossRevenue \- totalMLFees \- totalDirectCosts

  // Step 5: Calculate the Net Profit Margin as a percentage.  
  // Handle the edge case of a zero selling price to avoid division by zero.  
  IF grossRevenue \> 0 THEN  
    netMargin \= (netProfit / grossRevenue) \* 100  
  ELSE  
    netMargin \= 0  
  END IF

  // Step 6: Return a structured object with the final results and a breakdown for display.  
  RETURN {  
    netProfit: roundToTwoDecimals(netProfit),  
    netMargin: roundToTwoDecimals(netMargin),  
    breakdown: {  
      grossRevenue: grossRevenue,  
      mlCommission: mlCommission,  
      mlFixedFee: mlFixedFee,  
      shippingCost: shippingCost,  
      productCost: productCost,  
      otherCosts: otherCosts  
    }  
  }

END FUNCTION

### **5.3. Handling the Conditional Fixed Fee**

A critical piece of the fee structure in Brazil is the conditional fixed fee applied to items sold below a specific price threshold. This logic must be implemented precisely to ensure calculation accuracy.1

* **Logic:** According to Mercado Livre's pricing policy for Brazil, an additional fixed fee is charged for products priced up to BRL 79\.  
* **Pseudo-code:** The following function encapsulates this business rule.

FUNCTION getFixedFee(sellingPrice)  
  // Constants based on Mercado Livre's pricing for Brazil [1]  
  FIXED\_FEE\_THRESHOLD \= 79.00 // BRL  
  FIXED\_FEE\_AMOUNT \= 9.60     // BRL

  // Check if the selling price is below the threshold.  
  // Note: The rule is for products priced \*up to\* the threshold, which implies less than, not less than or equal to.  
  // This should be verified against the official documentation's exact wording. Assuming "up to" means \< 79\.  
  IF sellingPrice \< FIXED\_FEE\_THRESHOLD THEN  
    RETURN FIXED\_FEE\_AMOUNT  
  ELSE  
    RETURN 0  
  END IF  
END FUNCTION

---

## **6\. MVP Development Roadmap: A 3-Week Sprint Plan**

This section breaks down the entire development effort into a manageable, three-week timeline. Each sprint has a clear goal and a checklist of actionable tasks, providing a structured path from project inception to a launch-ready MVP.

### **6.1. Sprint 1 (Week 1): Foundation, Authentication, and Security**

* **Goal:** To build the secure, foundational core of the application, focusing on user identity and the connection to Mercado Livre.  
* **Tasks:**  
  * [ ] **Project Setup:** Initialize the monorepo with Vue.js for the frontend and Express.js for the backend.  
  * [ ] **Deployment Configuration:** Configure the project for deployment on Vercel, including setting up environment variables for development and production.  
  * [ ] **ML Application Registration:** Register the application in the Mercado Livre Developer Portal to obtain the App ID and Secret Key.14  
  * [ ] **User Model & Database:** Set up the Firestore database and define the data model for users.  
  * [ ] **Basic Authentication:** Implement local user registration (email/password) and login functionality.  
  * [ ] **OAuth Implementation:** Implement the full server-side OAuth 2.0 authentication flow, including the /api/auth/redirect and /api/auth/callback routes.15  
  * [ ] **Secure Token Storage:** Implement encryption for the OAuth tokens and securely save them to the user's record in Firestore upon successful authentication.26  
* **Deliverable:** A deployed application where a new user can register, log in, successfully connect their Mercado Livre account, and have their encrypted tokens securely stored in the database.

### **6.2. Sprint 2 (Week 2): The Calculator Core & API Logic**

* **Goal:** To build the primary functionality of the calculator by integrating with the Mercado Livre APIs and implementing the core business logic.  
* **Tasks:**  
  * [ ] **API Client:** Build a dedicated module in the backend for making authenticated requests to the Mercado Livre API.  
  * [ ] **Token Refresh Logic:** Implement the automatic access\_token refresh mechanism to handle token expiration.15  
  * [ ] **Endpoint Integration:** Implement the functions to call all required ML endpoints: /users/{user\_id}, /sites/MLB/listing\_prices, and /users/{user\_id}/shipping\_options.18  
  * [ ] **Calculation Engine:** Implement the calculateProfit and getFixedFee functions in the backend as specified in Section 5\.  
  * [ ] **Backend API Endpoint:** Create a main backend API endpoint (e.g., /api/calculate) that accepts calculator inputs from the frontend, orchestrates the calls to the ML API, runs the calculation, and returns the full profit breakdown.  
  * [ ] **Error Handling:** Implement robust error handling and logging for all API interactions and calculations.  
* **Deliverable:** A fully functional backend API that can receive pricing inputs and return an accurate, API-verified profit calculation. This can be tested independently using an API client like Postman or Insomnia.

### **6.3. Sprint 3 (Week 3): UI/UX Implementation and Pre-Launch Polish**

* **Goal:** To create the user-facing interface, connect it to the backend, and polish the application for its initial launch.  
* **Tasks:**  
  * [ ] **Landing Page:** Build the simple, public-facing landing page that communicates the value proposition.  
  * [ ] **Calculator UI:** Build the main calculator interface in Vue.js, including all input fields, dropdowns, and buttons.  
  * [ ] **Category Fetching:** Implement the logic to fetch and display the list of Mercado Livre categories for user selection.  
  * [ ] **Frontend-Backend Integration:** Connect the frontend UI to the /api/calculate backend endpoint, ensuring data flows correctly and the results are displayed in real-time.  
  * [ ] **Results Display:** Design and implement the results display panel, ensuring the profit and fee breakdown is clear, concise, and easy to understand.  
  * [ ] **UI/UX Polishing:** Refine the user interface, ensure the application is fully responsive for mobile devices, and improve the overall user experience.  
  * [ ] **End-to-End Testing:** Conduct thorough testing of the entire user flow, from registration and ML connection to performing multiple calculations.  
* **Deliverable:** A polished, fully functional, and deployed MVP that is ready for its first set of beta users.

#### **Referências citadas**

1. Pricing and Fee Structure \- Mercado Libre Global Selling | Sell in ..., acessado em julho 23, 2025, [https://global-selling.mercadolibre.com/landing/pricing](https://global-selling.mercadolibre.com/landing/pricing)  
2. Vercel vs Heroku: Pick the Perfect Cloud for Your Deployment \- CodeWalnut, acessado em julho 23, 2025, [https://www.codewalnut.com/learn/vercel-vs-heroku-which-one-should-you-choose](https://www.codewalnut.com/learn/vercel-vs-heroku-which-one-should-you-choose)  
3. Vercel vs Heroku: Which platform fits your workflow best? | Blog \- Northflank, acessado em julho 23, 2025, [https://northflank.com/blog/vercel-vs-heroku](https://northflank.com/blog/vercel-vs-heroku)  
4. www.remoteplatz.com, acessado em julho 23, 2025, [https://www.remoteplatz.com/en/blog/react-vs--next-js-vs--vue--which-one-should-your-s\#:\~:text=Choose%20React%20if%20you%20need,development%20and%20a%20simple%20structure.](https://www.remoteplatz.com/en/blog/react-vs--next-js-vs--vue--which-one-should-your-s#:~:text=Choose%20React%20if%20you%20need,development%20and%20a%20simple%20structure.)  
5. Vue vs React: Choosing the Best Framework for Your Next Project | Monterail blog, acessado em julho 23, 2025, [https://www.monterail.com/blog/vue-vs-react](https://www.monterail.com/blog/vue-vs-react)  
6. React vs Vue – Which Should You Select for Frontend Development?, acessado em julho 23, 2025, [https://www.promaticsindia.com/blog/react-vs-vue-which-should-you-select-for-frontend-development](https://www.promaticsindia.com/blog/react-vs-vue-which-should-you-select-for-frontend-development)  
7. startup-house.com, acessado em julho 23, 2025, [https://startup-house.com/blog/flask-vs-express-js-web-framework-comparison\#:\~:text=Flask%2C%20a%20microframework%20for%20Python,suited%20for%20high%2Dperformance%20applications.](https://startup-house.com/blog/flask-vs-express-js-web-framework-comparison#:~:text=Flask%2C%20a%20microframework%20for%20Python,suited%20for%20high%2Dperformance%20applications.)  
8. Flask vs Express.js: Top Differences \- GeeksforGeeks, acessado em julho 23, 2025, [https://www.geeksforgeeks.org/blogs/flask-vs-express-js/](https://www.geeksforgeeks.org/blogs/flask-vs-express-js/)  
9. Should I stick with Flask or jump ship to NodeJs? \- Reddit, acessado em julho 23, 2025, [https://www.reddit.com/r/flask/comments/1jflpk9/should\_i\_stick\_with\_flask\_or\_jump\_ship\_to\_nodejs/](https://www.reddit.com/r/flask/comments/1jflpk9/should_i_stick_with_flask_or_jump_ship_to_nodejs/)  
10. Choose a Database: Cloud Firestore or Realtime Database, acessado em julho 23, 2025, [https://firebase.google.com/docs/database/rtdb-vs-firestore](https://firebase.google.com/docs/database/rtdb-vs-firestore)  
11. Empower your Firebase with SQL features: Sync data from Firebase or Firestore to PostgreSQL database in real-time \- Jet Admin, acessado em julho 23, 2025, [https://www.jetadmin.io/blog/firestore-to-postgresql/](https://www.jetadmin.io/blog/firestore-to-postgresql/)  
12. PostgreSQL vs. MongoDB vs. Firebase: Which Database Should You Use? | RemotePlatz, acessado em julho 23, 2025, [https://www.remoteplatz.com/en/blog/postgresql-vs--mongodb-vs--firebase--which-databas](https://www.remoteplatz.com/en/blog/postgresql-vs--mongodb-vs--firebase--which-databas)  
13. Firebase vs. Supabase \- Bits and Pieces, acessado em julho 23, 2025, [https://blog.bitsrc.io/firebase-vs-supabase-6434980664d8](https://blog.bitsrc.io/firebase-vs-supabase-6434980664d8)  
14. Create application \- Developers, acessado em julho 23, 2025, [https://global-selling.mercadolibre.com/devsite/my-first-application-global-selling](https://global-selling.mercadolibre.com/devsite/my-first-application-global-selling)  
15. Authentication and Authorization \- Developers \- Mercado Libre, acessado em julho 23, 2025, [https://developers.mercadolibre.com.ar/devsite/authentication-and-authorization-global-selling](https://developers.mercadolibre.com.ar/devsite/authentication-and-authorization-global-selling)  
16. Application manager \- Developers \- Mercado Livre, acessado em julho 23, 2025, [https://developers.mercadolivre.com.br/en\_us/application-manager](https://developers.mercadolivre.com.br/en_us/application-manager)  
17. Autenticação e Autorização \- Developers \- Mercado Livre, acessado em julho 23, 2025, [https://developers.mercadolivre.com.br/pt\_br/autenticacao-e-autorizacao](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao)  
18. Users & Apps \- Developers \- Mercado Libre, acessado em julho 23, 2025, [https://developers.mercadolibre.com.ar/en\_us/usuarios-y-aplicaciones](https://developers.mercadolibre.com.ar/en_us/usuarios-y-aplicaciones)  
19. Manage users \- Developers \- Mercado Livre, acessado em julho 23, 2025, [https://developers.mercadolivre.com.br/en\_us/real-estate-manage-users](https://developers.mercadolivre.com.br/en_us/real-estate-manage-users)  
20. Fees for listing \- Developers \- Mercado Livre, acessado em julho 23, 2025, [https://developers.mercadolivre.com.br/en\_us/fees-for-listing](https://developers.mercadolivre.com.br/en_us/fees-for-listing)  
21. Domains and Categories \- Developers \- Mercado Libre, acessado em julho 23, 2025, [https://developers.mercadolibre.com.ar/en\_us/categories-and-listings](https://developers.mercadolibre.com.ar/en_us/categories-and-listings)  
22. Categories & attributes \- Developers \- Mercado Livre, acessado em julho 23, 2025, [https://developers.mercadolivre.com.br/en\_us/item-description-2/categories-attributes](https://developers.mercadolivre.com.br/en_us/item-description-2/categories-attributes)  
23. Shipments \- Developers \- Mercado Libre, acessado em julho 23, 2025, [https://developers.mercadolibre.com.ar/devsite/manage-shipments](https://developers.mercadolibre.com.ar/devsite/manage-shipments)  
24. Custom shipping \- Developers \- Mercado Livre, acessado em julho 23, 2025, [https://developers.mercadolivre.com.br/en\_us/custom-shipping](https://developers.mercadolivre.com.br/en_us/custom-shipping)  
25. Calculate shipping costs & handling time \- Developers \- Mercado Livre, acessado em julho 23, 2025, [https://developers.mercadolivre.com.br/en\_us/ios/calculate-shipping-costs-handling-time](https://developers.mercadolivre.com.br/en_us/ios/calculate-shipping-costs-handling-time)  
26. OAuth Best Practices \- Square Developer, acessado em julho 23, 2025, [https://developer.squareup.com/docs/oauth-api/best-practices](https://developer.squareup.com/docs/oauth-api/best-practices)  
27. Storing OAuth Tokens \- FusionAuth, acessado em julho 23, 2025, [https://fusionauth.io/articles/oauth/oauth-token-storage](https://fusionauth.io/articles/oauth/oauth-token-storage)  
28. App Monitoring, Error Tracking & Real User Monitoring | Insight Hub, acessado em julho 23, 2025, [https://www.bugsnag.com/](https://www.bugsnag.com/)  
29. Selling fee and Additional per unit fee \- Mercado Libre International Selling, acessado em julho 23, 2025, [https://global-selling.mercadolibre.com/help/17600](https://global-selling.mercadolibre.com/help/17600)