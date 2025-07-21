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

## Component Implementation

### Required Shadcn/UI Components:
- ✅ `card` - Client info and quote summary sections (CardHeader, CardContent)
- ✅ `label` - Form field labels for client info and overrides
- ✅ `input` - Client details and quantity inputs (already installed)
- ✅ `select` - Item selection dropdown from "My Items" database
- ✅ `table` - Line items display with real-time calculations
- ✅ `button` - Add item, remove item, save quote buttons (already installed)
- ✅ `separator` - Visual breaks between quote sections
- ✅ `toast` - Real-time feedback for quote operations (already installed)

### Implementation Pattern:
```tsx
// Quote creation page with sections
<div className="space-y-6">
  {/* Client Information */}
  <Card>
    <CardHeader>
      <CardTitle>Client Information</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3">
        <Label htmlFor="client-name">Client Name</Label>
        <Input id="client-name" placeholder="John Smith" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="client-contact">Contact Information</Label>
        <Input id="client-contact" placeholder="john@example.com" />
      </div>
    </CardContent>
  </Card>
  
  <Separator />
  
  {/* Line Items */}
  <Card>
    <CardHeader>
      <CardTitle>Quote Items</CardTitle>
      <div className="flex gap-2">
        <Select>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select an item to add" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mulch">Mulch Installation - $25.00/cubic yard</SelectItem>
            <SelectItem value="labor">Labor - $50.00/hour</SelectItem>
          </SelectContent>
        </Select>
        <Button>Add Item</Button>
      </div>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Mulch Installation</TableCell>
            <TableCell>
              <Input type="number" defaultValue="10" className="w-20" />
            </TableCell>
            <TableCell>$25.00</TableCell>
            <TableCell>$250.00</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">Remove</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
  
  <Separator />
  
  {/* Quote Summary */}
  <Card>
    <CardHeader>
      <CardTitle>Quote Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>$250.00</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-3">
          <Label htmlFor="tax-override">Tax Rate (%) - Override</Label>
          <Input id="tax-override" type="number" step="0.01" placeholder="8.25" />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="markup-override">Markup (%) - Override</Label>
          <Input id="markup-override" type="number" step="0.01" placeholder="20.00" />
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Tax (8.25%):</span>
          <span>$20.63</span>
        </div>
        <div className="flex justify-between">
          <span>Markup (20%):</span>
          <span>$50.00</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Final Total:</span>
          <span>$320.63</span>
        </div>
      </div>
      
      <Button className="w-full">Save Quote</Button>
    </CardContent>
  </Card>
</div>
```

### Key Features:
1. **Real-time Calculations**: Automatic updates as quantities change
2. **Item Selection**: Dropdown populated from user's "My Items" database
3. **Override Functionality**: Allow quote-specific tax/markup adjustments
4. **Dynamic Line Items**: Add/remove items with immediate calculation updates
5. **Professional Layout**: Card-based sections for clear organization
6. **Validation**: Numeric inputs with proper formatting

### File Locations:
- `app/(app)/quotes/new/page.tsx` - Main quote creation page
- `components/quotes/client-info-form.tsx` - Client information section
- `components/quotes/line-items-table.tsx` - Dynamic line items with calculations
- `components/quotes/quote-summary.tsx` - Totals and override section