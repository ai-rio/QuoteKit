# MDX Components Documentation

This directory contains custom components designed specifically for use in MDX blog content. These components enhance the blog experience with interactive elements, better formatting, and consistent styling.

## Available Components

### Callout Components

Styled callout boxes for highlighting important information.

#### Basic Usage

```jsx
<Callout variant="info" title="Important Note">
  This is an informational callout with a custom title.
</Callout>
```

#### Variants

- `info` (default) - Blue styling for general information
- `warning` - Yellow styling for warnings and cautions
- `success` - Green styling for positive messages
- `error` - Red styling for errors and critical information
- `tip` - Forest green styling for helpful tips

#### Convenience Components

```jsx
<InfoCallout title="Did you know?">
  You can use these callouts to highlight important information.
</InfoCallout>

<WarningCallout>
  Always test your changes before deploying to production.
</WarningCallout>

<SuccessCallout title="Great job!">
  Your setup is complete and ready to use.
</SuccessCallout>

<ErrorCallout>
  This action cannot be undone. Please proceed with caution.
</ErrorCallout>

<TipCallout title="Pro Tip">
  Use keyboard shortcuts to speed up your workflow.
</TipCallout>
```

### CodeBlock Component

Enhanced code blocks with syntax highlighting and copy functionality.

#### Basic Usage

```jsx
<CodeBlock language="javascript" title="Example Function">
{`function calculatePrice(area, rate) {
  return area * rate;
}`}
</CodeBlock>
```

#### Features

- **Copy to clipboard** - Click the copy button to copy code
- **Language support** - Specify language for proper highlighting
- **Line numbers** - Optional line number display
- **Custom titles** - Add descriptive titles to code blocks

#### Language-Specific Components

```jsx
<JavaScriptCode title="React Component">
{`export function MyComponent() {
  return <div>Hello World</div>;
}`}
</JavaScriptCode>

<TypeScriptCode showLineNumbers={true}>
{`interface User {
  id: string;
  name: string;
  email: string;
}`}
</TypeScriptCode>

<BashCode title="Installation Commands">
{`npm install @next/mdx
npm install gray-matter`}
</BashCode>

<SQLCode title="Database Query">
{`SELECT * FROM users 
WHERE created_at > '2024-01-01'
ORDER BY name ASC;`}
</SQLCode>
```

### PricingCalculator Component

Interactive calculator for demonstrating lawn care pricing.

#### Basic Usage

```jsx
<PricingCalculator />
```

#### Customization

```jsx
<PricingCalculator 
  title="Custom Calculator Title"
  showBreakdown={false}
  className="my-custom-class"
/>
```

#### Preset Calculators

```jsx
<MowingCalculator />
<SeasonalCalculator />
```

#### Features

- **Service selection** - Choose from different lawn care services
- **Real-time calculation** - Updates as you type
- **Tax calculation** - Configurable tax rate
- **Price breakdown** - Shows subtotal, tax, and total
- **Responsive design** - Works on all screen sizes

## Styling Guidelines

All components follow the LawnQuote design system:

- **Colors**: Uses the established color palette (forest-green, equipment-yellow, etc.)
- **Typography**: Consistent with the site's typography scale
- **Spacing**: Uses Tailwind's spacing system for consistency
- **Accessibility**: All components include proper ARIA labels and keyboard navigation

## Usage in MDX Files

To use these components in your MDX blog posts:

1. **Import is automatic** - Components are globally available in all MDX files
2. **Use JSX syntax** - Write components using standard JSX syntax
3. **Pass props** - All components accept props for customization
4. **Nest content** - Most components accept children for flexible content

## Example MDX Usage

```mdx
---
title: "My Blog Post"
description: "A post demonstrating MDX components"
---

# My Blog Post

Here's some regular markdown content.

<InfoCallout title="Getting Started">
  Before we dive in, make sure you have Node.js installed on your system.
</InfoCallout>

Let's look at some code:

<JavaScriptCode title="Hello World">
{`console.log("Hello, World!");`}
</JavaScriptCode>

Try out our pricing calculator:

<MowingCalculator />

<TipCallout>
  Remember to save your work frequently!
</TipCallout>
```

## Development Notes

- **Client Components**: Interactive components use `'use client'` directive
- **TypeScript**: All components are fully typed with TypeScript
- **Performance**: Components are optimized for minimal bundle impact
- **Testing**: Each component should be tested in isolation and within MDX content

## Contributing

When adding new MDX components:

1. Create the component in this directory
2. Export it from `index.ts`
3. Add it to `mdx-components.tsx`
4. Update this documentation
5. Add tests for the component
6. Test within actual MDX content
