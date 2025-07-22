import Link from "next/link"
import { Eye,FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'sent':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
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
            <div key={quote.id} className="flex items-center justify-between p-3 border border-stone-gray rounded-lg hover:bg-light-concrete transition-colors">
              <div className="flex-1">
                <div className="font-medium text-sm">{quote.clientName}</div>
                <div className="text-xs text-gray-500">{formatDate(quote.createdAt)}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={getStatusColor(quote.status)}>
                  {quote.status}
                </Badge>
                <div className="font-medium text-sm">{formatCurrency(quote.total)}</div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/quotes/${quote.id}`}>
                    <Eye className="h-4 w-4" />
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