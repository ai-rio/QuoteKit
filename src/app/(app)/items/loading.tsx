import { PageLoading } from "@/components/ui/loading"

export default function ItemsLoading() {
  return (
    <PageLoading 
      title="Loading Item Library..." 
      description="Fetching your items and categories"
    />
  )
}