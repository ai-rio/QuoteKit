import { PageLoading } from "@/components/ui/loading"

export default function QuotesLoading() {
  return (
    <PageLoading 
      title="Loading Quotes..." 
      description="Fetching your quote data"
    />
  )
}