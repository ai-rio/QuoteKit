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

## Component Implementation

### Required Shadcn/UI Components:
- ✅ `card` - Settings section containers (CardHeader, CardContent)
- ✅ `label` - Form field labels for company information
- ✅ `input` - Text inputs for company details and numeric percentage inputs (already installed)
- ✅ `button` - Save settings and file upload triggers (already installed)
- ✅ `separator` - Visual dividers between settings sections
- ✅ `avatar` - Company logo display with fallback
- ✅ `alert` - Success/error messages for save operations
- ✅ `toast` - Real-time feedback for settings updates (already installed)

### Implementation Pattern:
```tsx
// Settings page with organized sections
<div className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>Company Information</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3">
        <Label htmlFor="company-name">Company Name</Label>
        <Input id="company-name" placeholder="Your Company Name" />
      </div>
      
      <div className="grid gap-3">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="123 Main St, City, State" />
      </div>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src="/company-logo.png" />
          <AvatarFallback>Logo</AvatarFallback>
        </Avatar>
        <Button variant="outline">Upload Logo</Button>
      </div>
    </CardContent>
  </Card>
  
  <Separator />
  
  <Card>
    <CardHeader>
      <CardTitle>Quote Settings</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3">
        <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
        <Input id="tax-rate" type="number" step="0.01" placeholder="8.25" />
      </div>
      
      <div className="grid gap-3">
        <Label htmlFor="markup">Default Profit Markup (%)</Label>
        <Input id="markup" type="number" step="0.01" placeholder="20.00" />
      </div>
      
      <Button type="submit">Save Settings</Button>
    </CardContent>
  </Card>
</div>
```

### Key Features:
1. **Section Organization**: Use Card components to group related settings
2. **Logo Upload**: Avatar component with fallback for logo display
3. **Numeric Validation**: Input type="number" with step for percentage inputs
4. **Visual Separation**: Separator components between settings groups
5. **Save Feedback**: Toast notifications for successful updates
6. **Error Handling**: Alert components for validation errors

### File Locations:
- `app/(app)/settings/page.tsx` - Main settings page
- `components/settings/company-settings.tsx` - Company info form section
- `components/settings/quote-settings.tsx` - Quote calculation defaults section