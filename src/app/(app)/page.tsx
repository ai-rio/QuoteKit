import { redirect } from "next/navigation"

export default async function AppRootPage() {
  // Redirect to dashboard
  redirect('/dashboard')
}