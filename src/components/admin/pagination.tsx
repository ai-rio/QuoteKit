'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 7
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      let start = Math.max(2, currentPage - 2)
      let end = Math.min(totalPages - 1, currentPage + 2)
      
      // Add ellipsis if there's a gap
      if (start > 2) {
        pages.push('...')
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis if there's a gap
      if (end < totalPages - 1) {
        pages.push('...')
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()
  
  const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null
  const endItem = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 py-4">
      {/* Results info */}
      {totalItems && itemsPerPage && (
        <div className="text-sm text-charcoal/70">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
      )}
      
      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="border-stone-gray text-charcoal hover:bg-stone-gray/20 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-charcoal/60">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }
            
            const isCurrentPage = page === currentPage
            
            return (
              <Button
                key={page}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={
                  isCurrentPage 
                    ? "bg-forest-green text-white hover:opacity-90" 
                    : "border-stone-gray text-charcoal hover:bg-stone-gray/20"
                }
              >
                {page}
              </Button>
            )
          })}
        </div>
        
        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="border-stone-gray text-charcoal hover:bg-stone-gray/20 disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}