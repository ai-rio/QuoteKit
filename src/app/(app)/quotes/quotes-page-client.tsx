'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { deleteQuote, getQuotes } from '@/features/quotes/actions';
import { Quote } from '@/features/quotes/types';

interface QuotesPageClientProps {
  initialQuotes: Quote[];
}

export function QuotesPageClient({ initialQuotes }: QuotesPageClientProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshQuotes = useCallback(async () => {
    const { data } = await getQuotes();
    if (data) {
      setQuotes(data);
    }
  }, []);

  async function handleDelete(quoteId: string, clientName: string) {
    if (!confirm(`Are you sure you want to delete the quote for "${clientName}"?`)) {
      return;
    }

    setDeletingId(quoteId);

    const response = await deleteQuote(quoteId);

    if (response.error) {
      toast({
        variant: 'destructive',
        description: response.error.message || 'Failed to delete quote',
      });
    } else {
      toast({
        description: 'Quote deleted successfully',
      });
      refreshQuotes();
    }

    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Quotes</h1>
          <p className="text-muted-foreground">
            Manage your client quotes and create new ones.
          </p>
        </div>
        <Button asChild>
          <Link href="/quotes/new">Create New Quote</Link>
        </Button>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-4">No quotes created yet.</p>
          <Button asChild>
            <Link href="/quotes/new">Create Your First Quote</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.client_name}</TableCell>
                  <TableCell>{quote.client_contact || '—'}</TableCell>
                  <TableCell>{quote.quote_data.length} item(s)</TableCell>
                  <TableCell className="font-medium">${quote.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(quote.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quote.id, quote.client_name)}
                      disabled={deletingId === quote.id}
                    >
                      {deletingId === quote.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}