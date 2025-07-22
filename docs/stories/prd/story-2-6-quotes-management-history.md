# Story 2.6: Quotes Management & History 🚧 PLANNED

As a user,  
I want to manage all my quotes in one place,  
so that I can track my business activity and reuse previous work.

## 🚧 Implementation Status: PLANNED
**Target**: Epic 2 Phase 3  
**Dependencies**: Stories 2.1-2.5 (All previous Epic 2 stories)
**Status**: Ready for development

## Acceptance Criteria

1. A user can access a comprehensive quotes listing page with all their created quotes.  
2. Quotes are displayed with status indicators (Draft, Sent, Accepted, Declined, Expired).  
3. The interface provides search and filtering capabilities by client, date, status, and amount.  
4. Users can sort quotes by date, client name, total amount, or status.  
5. Each quote shows key information: number, client, date, total, and status at a glance.  
6. Users can quickly duplicate existing quotes to create similar new quotes.  
7. Quote templates can be created and reused for common services.  
8. The interface provides bulk operations for managing multiple quotes.  
9. Users can track quote history and client relationships over time.

## Component Implementation

### Required Shadcn/UI Components:
- ✅ `table` - Quotes listing with sorting capabilities
- ✅ `badge` - Status indicators for quote states
- ✅ `button` - Actions for view, edit, duplicate, delete (already installed)
- ✅ `dialog` - Confirmation dialogs and quote preview
- ✅ `input` - Search and filter inputs (already installed)
- ✅ `select` - Status and sorting dropdowns
- ✅ `calendar` - Date range filtering
- ✅ `checkbox` - Bulk selection functionality
- ✅ `tabs` - Organize quotes by status or view type

### Enhanced Components to Build:
```tsx
// Comprehensive quotes management interface
<QuotesManager>
  <QuotesHeader>
    <PageTitle>My Quotes</PageTitle>
    <QuotesActions>
      <SearchInput 
        placeholder="Search quotes..."
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <CreateQuoteButton href="/quotes/new" />
    </QuotesActions>
  </QuotesHeader>
  
  <QuotesFilters>
    <StatusFilter 
      statuses={quoteStatuses}
      selected={selectedStatus}
      onChange={setSelectedStatus}
    />
    <DateRangeFilter 
      dateRange={dateRange}
      onChange={setDateRange}
    />
    <ClientFilter 
      clients={uniqueClients}
      selected={selectedClient}
      onChange={setSelectedClient}
    />
    <SortOptions 
      sortBy={sortBy}
      sortOrder={sortOrder}
      onChange={handleSortChange}
    />
  </QuotesFilters>
  
  <QuotesTable>
    <TableHeader>
      <SelectAllCheckbox />
      <SortableColumn field="quote_number">Quote #</SortableColumn>
      <SortableColumn field="client_name">Client</SortableColumn>
      <SortableColumn field="created_at">Date</SortableColumn>
      <SortableColumn field="total">Total</SortableColumn>
      <SortableColumn field="status">Status</SortableColumn>
      <Column>Actions</Column>
    </TableHeader>
    <TableBody>
      {filteredQuotes.map(quote => (
        <QuoteRow 
          key={quote.id}
          quote={quote}
          selected={selectedQuotes.includes(quote.id)}
          onSelect={handleQuoteSelect}
          onView={handleQuoteView}
          onEdit={handleQuoteEdit}
          onDuplicate={handleQuoteDuplicate}
          onStatusChange={handleStatusChange}
        />
      ))}
    </TableBody>
  </QuotesTable>
  
  <BulkActions visible={selectedQuotes.length > 0}>
    <BulkStatusUpdate quotes={selectedQuotes} />
    <BulkDeleteButton onClick={handleBulkDelete} />
    <BulkExportButton onClick={handleBulkExport} />
  </BulkActions>
  
  <QuotesPagination 
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />
</QuotesManager>
```

### Implementation Pattern:
1. **Comprehensive Quote Tracking**: Full lifecycle management from draft to completion
2. **Advanced Search and Filter**: Multi-criteria filtering for large quote collections
3. **Status Management**: Professional quote status workflow
4. **Template System**: Reusable quote templates for efficiency
5. **Client Relationship Tracking**: History and patterns with clients
6. **Business Intelligence**: Analytics and insights from quote data

### Key Features:
1. **Quote Status Lifecycle**: Draft → Sent → Accepted/Declined/Expired workflow
2. **Advanced Search/Filter**: Multi-criteria search across all quote data
3. **Quote Templates**: Save common quote configurations for reuse
4. **Client History**: Track all interactions and quotes with each client
5. **Bulk Operations**: Efficient management of multiple quotes
6. **Business Analytics**: Insights into quote success rates and trends

### Advanced Features:

**Quote Status Management**:
- Draft (work in progress)
- Sent (delivered to client)
- Accepted (client approved)
- Declined (client rejected)
- Expired (time-limited quotes)
- Converted (became invoice/work order)

**Template System**:
- Save quotes as reusable templates
- Template categories (Lawn Care, Landscaping, Maintenance)
- Quick template application to new quotes
- Template sharing (future enhancement)

**Client Relationship Management**:
- Client history timeline
- Total business value per client
- Quote acceptance rates by client
- Client contact information management
- Follow-up reminders and notes

**Business Intelligence**:
- Quote success rate analytics
- Revenue pipeline tracking
- Seasonal business patterns
- Popular services analysis
- Client acquisition metrics

### Technical Implementation:
- Implement quote status enum in database
- Create advanced filtering and search system
- Build template saving and loading functionality
- Add client relationship tracking
- Implement pagination for large quote collections

### Database Enhancements:
```sql
-- Quote status and management enhancements
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted');
ALTER TABLE public.quotes ALTER COLUMN status TYPE quote_status USING status::quote_status;

-- Additional quote management fields
ALTER TABLE public.quotes ADD COLUMN sent_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN expires_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN follow_up_date TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN notes TEXT;
ALTER TABLE public.quotes ADD COLUMN is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE public.quotes ADD COLUMN template_name TEXT;

-- Client management table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);

-- Quote search index
CREATE INDEX idx_quotes_search ON public.quotes USING gin(to_tsvector('english', client_name || ' ' || COALESCE(notes, '')));
CREATE INDEX idx_quotes_status_date ON public.quotes(status, created_at);
```

### File Locations:
- `src/app/(app)/quotes/page.tsx` - Main quotes listing page
- `src/features/quotes/components/QuotesManager.tsx` - Quotes management interface
- `src/features/quotes/components/QuotesTable.tsx` - Advanced quotes table
- `src/features/quotes/components/QuoteFilters.tsx` - Search and filter controls
- `src/features/quotes/components/QuoteStatusBadge.tsx` - Status display
- `src/features/quotes/components/QuoteTemplates.tsx` - Template management
- `src/features/quotes/hooks/useQuoteSearch.ts` - Advanced search functionality
- `src/features/quotes/utils/quote-analytics.ts` - Business intelligence

## Integration Points

**Complete Epic 2 Integration**: This story builds on all previous Epic 2 stories to provide comprehensive quote management.

**Epic 1 Compatibility**: Enhances existing quote functionality (Epic 1 Stories 1.4-1.5) with advanced management capabilities.

**Dashboard Integration**: Quote statistics and recent activity feed into enhanced dashboard (Story 2.2).

**PDF Generation**: Seamless integration with existing PDF generation (Epic 1 Story 1.5) from quote listings.

**Client Management**: Foundation for future client relationship management features.

This story completes the transformation of LawnQuote from a basic quote generator into a comprehensive business management tool for landscaping professionals.