# **LawnQuote Public-Facing Pages: Style & Implementation Guide**

**Version 1.0 | Last Updated: August 3, 2025**

## **1.0 Core Brand Principles**

This guide translates the LawnQuote brand identity into a functional design and development system. All public-facing assets must adhere to these principles to create a cohesive, trustworthy, and high-converting user experience.

* **Brand Identity:** The Pro-Grade Kit  
* **Vibe:** A premium, indispensable part of a modern landscaper's toolkit. Clean, trustworthy, and professional-grade.  
* **Guiding Principles:** Speed, Simplicity, Clarity, Confidence.

## **2.0 Logo Usage**

The LawnQuote logo is the "Initial Stack" monogram. It should be used consistently across all assets.

* **Primary Logo:** The "LQ" monogram within a forest-green square, used in the header.  
* **Clear Space:** Maintain a clear space around the logo equal to half its width.  
* **Don'ts:** Do not stretch, rotate, or change the colors of the logo.

## **3.0 Color Palette**

Our color palette is designed to evoke trust, professionalism, and action. All colors are WCAG AAA compliant for accessibility.

| Role | Name | Hex | Tailwind Class | Usage |
| :---- | :---- | :---- | :---- | :---- |
| **Primary** | Forest Green | #2A3D2F | bg-forest-green | Primary backgrounds, text, CTAs |
| **Accent** | Equipment Yellow | #F2B705 | bg-equipment-yellow | Primary CTAs, highlights, interactive states |
| **Neutral** | Light Concrete | #F5F5F5 | bg-light-concrete | Page backgrounds |
| **Neutral** | Paper White | #FFFFFF | bg-paper-white | Card backgrounds, text on dark |
| **Neutral** | Stone Gray | #D7D7D7 | bg-stone-gray | Borders, dividers, disabled states |
| **Text** | Charcoal | #1C1C1C | text-charcoal | All primary body copy and headlines |

### **Next.js Implementation (tailwind.config.js):**

// tailwind.config.js  
module.exports \= {  
  theme: {  
    extend: {  
      colors: {  
        'forest-green': '#2A3D2F',  
        'equipment-yellow': '#F2B705',  
        'light-concrete': '#F5F5F5',  
        'stone-gray': '#D7D7D7',  
        'charcoal': '#1C1C1C',  
        'paper-white': '#FFFFFF',  
      },  
    },  
  },  
  plugins: \[\],  
}

## **4.0 Typography**

Our typography system is built for clarity and professionalism, using two core fonts.

* **Headlines & UI Text:** Inter  
* **Financial Data & Code:** Roboto Mono

### **Hierarchy & Scale:**

| Element | Font | Weight | Size (Mobile) | Size (Desktop) | Tailwind Class |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **H1** | Inter | 900 (Black) | text-4xl (36px) | text-6xl (60px) | font-black |
| **H2** | Inter | 900 (Black) | text-3xl (30px) | text-4xl (36px) | font-black |
| **H3** | Inter | 700 (Bold) | text-xl (20px) | text-2xl (24px) | font-bold |
| **Body** | Inter | 400 (Regular) | text-lg (18px) | text-lg (18px) | text-lg |
| **Subtle** | Inter | 400 (Regular) | text-sm (14px) | text-sm (14px) | text-sm |
| **Financial** | Roboto Mono | 500 (Medium) | text-base | text-base | font-mono |

### **Next.js Implementation (e.g., \_app.js or layout component):**

// In your main layout file  
import { Inter, Roboto\_Mono } from 'next/font/google';

const inter \= Inter({ subsets: \['latin'\], variable: '--font-inter' });  
const robotoMono \= Roboto\_Mono({ subsets: \['latin'\], variable: '--font-roboto-mono' });

export default function RootLayout({ children }) {  
  return (  
    <html lang="en" className={\`${inter.variable} ${robotoMono.variable}\`}\>  
      <body\>{children}</body\>  
    </html\>  
  );  
}

// tailwind.config.js  
// ...  
fontFamily: {  
  sans: \['var(--font-inter)', 'sans-serif'\],  
  mono: \['var(--font-roboto-mono)', 'monospace'\],  
}  
// ...

## **5.0 Component Library**

### **Buttons**

Buttons are the primary interactive elements. Their styling should be consistent and clear.

**Primary CTA (Equipment Yellow):** For the most important action on a page (e.g., "Start for Free").

<a href="#" class="bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"\>  
  Create Your Free Account  
</a\>

**Secondary CTA (Ghost Style):** For secondary actions.

<a href="#" class="bg-paper-white/20 text-paper-white font-bold px-8 py-4 rounded-lg hover:bg-paper-white/30 transition-all duration-200"\>  
  See Pricing  
</a\>

**Standard Button (Forest Green):** For standard form submissions.

<button type="submit" class="w-full bg-forest-green text-paper-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity"\>  
  Send Message  
</button\>

### **Cards**

Cards are used to group related content. They should be clean and spacious.

<div class="bg-paper-white p-8 rounded-2xl border border-stone-gray/20 shadow-lg"\>  
  <\!-- Card Content \--\>  
</div\>

### **Forms & Toggles**

Form elements should be clean, accessible, and provide clear focus states.

**Input Field:**

<input type="text" class="block w-full rounded-lg border-0 py-3 px-4 bg-light-concrete text-charcoal shadow-sm ring-1 ring-inset ring-stone-gray/50 placeholder:text-charcoal/60 focus:ring-2 focus:ring-inset focus:ring-forest-green"\>

**Billing Toggle:**

<label class="relative inline-flex items-center cursor-pointer"\>  
    <input type="checkbox" class="sr-only peer" id="billing-toggle"\>  
    <div class="w-14 h-8 bg-stone-gray/50 rounded-full peer peer-checked:bg-forest-green peer-checked:after:translate-x-full after:content-\[''\] after:absolute after:top-1 after:left-\[4px\] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"\></div\>  
</label\>

## **6.0 Voice & Tone**

Our voice reflects the "Pro-Grade Kit" identity. It is confident, clear, and direct, speaking to the user as a fellow professional.

* **Confident:** We use declarative statements. (e.g., "Stop underbidding. Start winning jobs.")  
* **Clear & Direct:** We avoid jargon and get straight to the point. (e.g., "5 Quotes / Month")  
* **Empathetic:** We acknowledge the user's pain points, using language from our market research. (e.g., "Built for the Trade," referencing r/landscaping)  
* **Benefit-Oriented:** We always frame features in terms of their value to the user's business. (e.g., "Turn chaos into cashflow.")

## **7.0 Next.js Conversion Checklist**

When converting the HTML mockups to a Next.js application, follow these steps:

1. **Project Setup:** Use create-next-app with Tailwind CSS integration.  
2. **Configure tailwind.config.js:** Add the color palette and font families defined in this guide.  
3. **Setup Fonts:** Use next/font to import Inter and Roboto Mono and apply them in a root layout file (layout.js or \_app.js).  
4. **Create Reusable Components:**  
   * Header.js  
   * Footer.js  
   * Button.js (with variants for primary, secondary, etc.)  
   * Card.js  
5. **Structure Pages:** Create a file for each page in the pages or app directory (e.g., index.js, about.js, pricing.js).  
6. **Implement Interactivity:** Re-implement JavaScript logic (toggles, accordions, search) within React components using useState and useEffect hooks.  
7. **SEO:** Use Next.js's built-in features (<Head\> or metadata API) to manage page titles, descriptions, and the JSON-LD schema for the blog.  
8. **Consistency Check:** Before finalizing, review every page against this style guide to ensure 100% consistency.