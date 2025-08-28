# shadcn/ui v4 Tool Usage Patterns: Complete Reference Guide

**Objective**: Document every shadcn/ui v4 MCP tool with usage patterns, common scenarios, and QuoteKit-specific applications to ensure consistent agent behavior.

---

## 🛠️ AVAILABLE TOOLS REFERENCE

### **Core Discovery Tools**

#### **`mcp__shadcn-ui-v4__list_components`**
**Purpose**: Get all available shadcn/ui components
**Usage**: ALWAYS run this first before any UI work
**Parameters**: None

```bash
# MANDATORY first step for any UI task
mcp__shadcn-ui-v4__list_components
```

**Expected Output**: Complete list of components like button, card, form, input, table, etc.

#### **`mcp__shadcn-ui-v4__list_blocks`**
**Purpose**: Get all available shadcn/ui blocks (complex pre-built layouts)
**Usage**: Run when building complex layouts or dashboards
**Parameters**: 
- `category` (optional): Filter by category like "dashboard", "calendar", "login", etc.

```bash
# Get all blocks
mcp__shadcn-ui-v4__list_blocks

# Get dashboard-specific blocks
mcp__shadcn-ui-v4__list_blocks category="dashboard"

# Get other categories
mcp__shadcn-ui-v4__list_blocks category="calendar"
mcp__shadcn-ui-v4__list_blocks category="sidebar"
```

**Expected Output**: Categorized list of pre-built complex layouts

### **Component Retrieval Tools**

#### **`mcp__shadcn-ui-v4__get_component`**
**Purpose**: Get source code for specific component
**Usage**: After identifying needed component from list
**Parameters**: 
- `componentName` (required): Name of component like "button", "card", "form"

```bash
# Get specific components
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="form"
mcp__shadcn-ui-v4__get_component componentName="input"
mcp__shadcn-ui-v4__get_component componentName="table"
```

**Expected Output**: Complete TypeScript source code for the component

#### **`mcp__shadcn-ui-v4__get_component_demo`**
**Purpose**: Get usage examples and demo code for component
**Usage**: After getting component source, to understand implementation
**Parameters**: 
- `componentName` (required): Name of component

```bash
# Get usage examples
mcp__shadcn-ui-v4__get_component_demo componentName="button"
mcp__shadcn-ui-v4__get_component_demo componentName="form"
mcp__shadcn-ui-v4__get_component_demo componentName="table"
```

**Expected Output**: Demo code showing proper component usage patterns

#### **`mcp__shadcn-ui-v4__get_block`**
**Purpose**: Get source code for complex blocks
**Usage**: When building dashboard, calendar, login pages, etc.
**Parameters**: 
- `blockName` (required): Name like "dashboard-01", "calendar-01", "login-02"
- `includeComponents` (optional): Include component files, default true

```bash
# Get dashboard blocks
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"
mcp__shadcn-ui-v4__get_block blockName="dashboard-02"

# Get other common blocks
mcp__shadcn-ui-v4__get_block blockName="calendar-01"
mcp__shadcn-ui-v4__get_block blockName="sidebar-01"
mcp__shadcn-ui-v4__get_block blockName="login-02"
```

**Expected Output**: Complete source code for complex layouts with multiple components

### **Metadata Tools**

#### **`mcp__shadcn-ui-v4__get_component_metadata`**
**Purpose**: Get component information, dependencies, and details
**Usage**: For understanding component requirements and variants
**Parameters**: 
- `componentName` (required): Component name

```bash
mcp__shadcn-ui-v4__get_component_metadata componentName="button"
```

**Expected Output**: Metadata including dependencies, variants, and usage notes

#### **`mcp__shadcn-ui-v4__get_directory_structure`**
**Purpose**: Understand shadcn/ui repository structure
**Usage**: For exploring organization and finding components
**Parameters**: 
- `owner` (optional): Default "shadcn-ui"  
- `repo` (optional): Default "ui"
- `branch` (optional): Default "main"
- `path` (optional): Specific path to explore

```bash
mcp__shadcn-ui-v4__get_directory_structure
```

**Expected Output**: Directory tree showing shadcn/ui organization

---

## 🎯 USAGE PATTERNS BY SCENARIO

### **Scenario 1: Simple Form Creation**

**Workflow:**
```bash
# Step 1: Discover available components
mcp__shadcn-ui-v4__list_components

# Step 2: Get form-related components
mcp__shadcn-ui-v4__get_component componentName="form"
mcp__shadcn-ui-v4__get_component componentName="input"
mcp__shadcn-ui-v4__get_component componentName="label"
mcp__shadcn-ui-v4__get_component componentName="button"

# Step 3: Get usage examples
mcp__shadcn-ui-v4__get_component_demo componentName="form"
```

**Implementation Template:**
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// QuoteKit styling applied to shadcn/ui components
```

### **Scenario 2: Data Table Creation**

**Workflow:**
```bash
# Step 1: Check for table components
mcp__shadcn-ui-v4__list_components

# Step 2: Get table component and related components
mcp__shadcn-ui-v4__get_component componentName="table"
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="input"  # for search

# Step 3: Check for data-table blocks
mcp__shadcn-ui-v4__list_blocks

# Step 4: Get data table demo
mcp__shadcn-ui-v4__get_component_demo componentName="table"
```

**Note**: Use blocks for complex data tables with sorting, filtering, pagination

### **Scenario 3: Dashboard Creation**

**Workflow:**
```bash
# Step 1: Look for dashboard blocks first
mcp__shadcn-ui-v4__list_blocks category="dashboard"

# Step 2: Get specific dashboard block
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"

# Step 3: Get individual components for customization
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="chart"  # if available
```

**Key Pattern**: Always use blocks for complex layouts, then customize with individual components

### **Scenario 4: Navigation Components**

**Workflow:**
```bash
# Step 1: Check navigation components
mcp__shadcn-ui-v4__list_components

# Step 2: Get navigation components
mcp__shadcn-ui-v4__get_component componentName="navigation-menu"
mcp__shadcn-ui-v4__get_component componentName="breadcrumb"
mcp__shadcn-ui-v4__get_component componentName="tabs"

# Step 3: Check for sidebar blocks
mcp__shadcn-ui-v4__list_blocks category="sidebar"
mcp__shadcn-ui-v4__get_block blockName="sidebar-01"
```

### **Scenario 5: Modal/Dialog Creation**

**Workflow:**
```bash
# Step 1: Get dialog components
mcp__shadcn-ui-v4__get_component componentName="dialog"
mcp__shadcn-ui-v4__get_component componentName="sheet"  # for mobile-friendly modals

# Step 2: Get supporting components
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="form"

# Step 3: Get usage examples
mcp__shadcn-ui-v4__get_component_demo componentName="dialog"
```

---

## 📋 QUICKSTART CHECKLISTS

### **For Any UI Component Task**

**Phase 1: Discovery** ✅
```bash
[ ] mcp__shadcn-ui-v4__list_components                    # See what's available
[ ] mcp__shadcn-ui-v4__list_blocks                        # Check for complex layouts
[ ] Identify 2-3 components that meet requirements
```

**Phase 2: Retrieval** ✅  
```bash
[ ] mcp__shadcn-ui-v4__get_component componentName="..."  # Get component source
[ ] mcp__shadcn-ui-v4__get_component_demo componentName="..." # Get usage examples
[ ] mcp__shadcn-ui-v4__get_block blockName="..." (if using blocks)
```

**Phase 3: Implementation** ✅
```bash
[ ] Apply QuoteKit styling to shadcn/ui components
[ ] Add required tooltips to all interactive elements
[ ] Test responsiveness and accessibility
```

### **For Complex Layout Tasks**

**Phase 1: Block-First Approach** ✅
```bash
[ ] mcp__shadcn-ui-v4__list_blocks                        # Find relevant blocks
[ ] mcp__shadcn-ui-v4__list_blocks category="dashboard"   # Filter by category
[ ] mcp__shadcn-ui-v4__get_block blockName="dashboard-01" # Get block source
```

**Phase 2: Customization** ✅
```bash
[ ] mcp__shadcn-ui-v4__get_component componentName="card" # Get individual components
[ ] Apply QuoteKit styling patterns to block components
[ ] Modify layout structure as needed
```

**Phase 3: Integration** ✅
```bash
[ ] Ensure consistent styling across all block components
[ ] Add QuoteKit-specific interactions and states
[ ] Validate accessibility and mobile responsiveness
```

---

## 🔧 COMMON TOOL COMBINATIONS

### **Forms + Validation**
```bash
mcp__shadcn-ui-v4__get_component componentName="form"
mcp__shadcn-ui-v4__get_component componentName="input"
mcp__shadcn-ui-v4__get_component componentName="select"
mcp__shadcn-ui-v4__get_component componentName="textarea" 
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="alert"    # for error states
```

### **Data Display + Actions**
```bash
mcp__shadcn-ui-v4__get_component componentName="table"
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="dropdown-menu"
mcp__shadcn-ui-v4__get_component componentName="dialog"   # for actions
```

### **Navigation + Layout**
```bash
mcp__shadcn-ui-v4__get_component componentName="breadcrumb"
mcp__shadcn-ui-v4__get_component componentName="tabs"
mcp__shadcn-ui-v4__list_blocks category="sidebar"
mcp__shadcn-ui-v4__get_block blockName="sidebar-01"
```

### **Dashboard + Charts**
```bash
mcp__shadcn-ui-v4__list_blocks category="dashboard"
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="progress"
```

---

## ⚠️ ANTI-PATTERNS TO AVOID

### **❌ Wrong Approach: Manual Component Creation**
```typescript
// NEVER DO THIS
const CustomButton = () => {
  return <button className="...">Click me</button>
}
```

### **❌ Wrong Approach: Skipping Tool Discovery**  
```typescript
// NEVER DO THIS - Building without checking available components
import React from 'react'
const DataTable = () => {
  return (
    <div className="table-container">
      <table>...</table>
    </div>
  )
}
```

### **❌ Wrong Approach: Not Using Blocks for Complex Layouts**
```typescript
// NEVER DO THIS - Manual dashboard creation
const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="sidebar">...</div>
      <div className="main-content">...</div>
    </div>
  )
}
```

### **✅ Correct Approach: Tool-First Development**
```bash
# ALWAYS DO THIS FIRST
mcp__shadcn-ui-v4__list_components
mcp__shadcn-ui-v4__list_blocks
mcp__shadcn-ui-v4__get_component componentName="table" 
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"

# THEN implement using retrieved components
```

---

## 📊 QUOTEKIT-SPECIFIC TOOL USAGE

### **Assessment Forms**
**Required Tools:**
```bash
mcp__shadcn-ui-v4__get_component componentName="form"
mcp__shadcn-ui-v4__get_component componentName="input"
mcp__shadcn-ui-v4__get_component componentName="textarea"
mcp__shadcn-ui-v4__get_component componentName="select"
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="progress"    # for form progress
mcp__shadcn-ui-v4__get_component componentName="tabs"       # for form sections
```

**QuoteKit Styling Application:**
- Forest green buttons for primary actions
- Charcoal text for form labels
- Equipment yellow for important CTAs

### **Quote Creation Interface**
**Required Tools:**
```bash
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="table"
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="dialog"     # for line item details
mcp__shadcn-ui-v4__get_component componentName="input"      # for pricing inputs
```

**QuoteKit Styling Application:**
- Font-mono for all pricing displays
- Forest green for calculated totals
- Paper white cards with stone gray borders

### **Property Management Dashboard**
**Required Tools:**
```bash
mcp__shadcn-ui-v4__list_blocks category="dashboard"
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="table"
mcp__shadcn-ui-v4__get_component componentName="breadcrumb"
```

**QuoteKit Styling Application:**
- Consistent card styling across dashboard
- Forest green headings for property names
- Equipment yellow for urgent actions

### **Client Assessment Reports**
**Required Tools:**
```bash
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="progress"   # for condition scores
mcp__shadcn-ui-v4__get_component componentName="badge"     # for status indicators
mcp__shadcn-ui-v4__get_component componentName="separator" # for section dividers
```

**QuoteKit Styling Application:**
- Professional presentation with consistent spacing
- Color-coded condition indicators
- Clear financial data presentation

---

## 🎯 SUCCESS METRICS

### **Tool Usage Validation** ✅
- [ ] Every UI component uses shadcn/ui v4 source code
- [ ] Zero manual component creation in codebase
- [ ] All complex layouts use shadcn/ui blocks as foundation
- [ ] Component demos consulted for proper usage patterns

### **Pattern Consistency** ✅
- [ ] Same components used for same purposes across app
- [ ] Consistent tool command usage across all agents  
- [ ] Block-first approach for all complex layouts
- [ ] Demo code patterns followed for all implementations

### **QuoteKit Integration** ✅
- [ ] All shadcn/ui components styled with QuoteKit patterns
- [ ] Color palette consistently applied to all components
- [ ] Typography hierarchy maintained across all UI elements
- [ ] Financial data consistently uses font-mono styling

---

## 📚 TOOL COMMAND REFERENCE CARD

**Print this out and keep handy for every UI task:**

```bash
# DISCOVERY (Always run first)
mcp__shadcn-ui-v4__list_components
mcp__shadcn-ui-v4__list_blocks
mcp__shadcn-ui-v4__list_blocks category="dashboard"

# COMPONENT RETRIEVAL  
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component componentName="form"
mcp__shadcn-ui-v4__get_component componentName="input"
mcp__shadcn-ui-v4__get_component componentName="table"

# BLOCK RETRIEVAL (Complex layouts)
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"
mcp__shadcn-ui-v4__get_block blockName="sidebar-01"

# EXAMPLES & METADATA
mcp__shadcn-ui-v4__get_component_demo componentName="button"
mcp__shadcn-ui-v4__get_component_metadata componentName="button"
mcp__shadcn-ui-v4__get_directory_structure
```

**Remember**: NEVER build UI components manually. Always use these tools first, then apply QuoteKit styling patterns to the retrieved shadcn/ui components.