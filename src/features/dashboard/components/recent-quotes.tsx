import { Eye, FileText } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QuoteStatusBadge } from "@/features/quotes/components/QuoteStatusBadge"

import { RecentQuote } from "../types"

interface RecentQuotesProps {
  quotes: RecentQuote[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}


export function RecentQuotes({ quotes }: RecentQuotesProps) {
  if (quotes.length === 0) {
    return (
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-charcoal font-bold">
            <FileText className="h-5 w-5" />
            Recent Quotes
          </CardTitle>
          <CardDescription className="text-charcoal/70">Your latest quote activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-charcoal/30 mx-auto mb-4" />
            <p className="text-charcoal/60 mb-4">No quotes created yet</p>
            <Button asChild className="bg-forest-green text-white hover:opacity-90 font-bold">
              <Link href="/quotes/new">
                Create Your First Quote
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Quotes
        </CardTitle>
        <CardDescription className="text-charcoal/70">Your latest quote activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="flex items-center justify-between p-3 border border-stone-gray rounded-lg hover:bg-light-concrete/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-charcoal">{quote.clientName}</span>
                  {quote.quoteNumber && (
                    <span className="text-xs text-charcoal/60 font-mono">#{quote.quoteNumber}</span>
                  )}
                </div>
                <div className="text-xs text-charcoal/60">{formatDate(quote.createdAt)}</div>
              </div>
              <div className="flex items-center gap-3">
                <QuoteStatusBadge status={quote.status} />
                <div className="font-mono font-medium text-sm text-charcoal">{formatCurrency(quote.total)}</div>
                <Button variant="ghost" size="sm" asChild className="hover:bg-stone-gray/20">
                  <Link href={`/quotes`}>
                    <Eye className="h-4 w-4 text-charcoal" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {quotes.length > 0 && (
            <div className="text-center pt-4">
              <Button asChild className="bg-forest-green text-white hover:opacity-90 font-bold">
                <Link href="/quotes">
                  View All Quotes
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}