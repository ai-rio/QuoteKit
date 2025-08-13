import "@/styles/driver-tour.css"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { OnboardingDebugPanel } from "@/components/onboarding/OnboardingDebugPanel"
import { OnboardingManager } from "@/components/onboarding/OnboardingManager"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import { OnboardingWrapper } from "@/contexts/onboarding-wrapper"
import { TOUR_CONFIGS } from "@/libs/onboarding/tour-configs"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tours = Object.values(TOUR_CONFIGS)
  
  return (
    <OnboardingWrapper>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col p-4 bg-light-concrete min-h-[calc(100vh-4rem)]">
            {children}
          </div>
        </SidebarInset>
        <OnboardingManager autoStartWelcome={true} enableTierBasedTours={true} debugMode={true} />
        <OnboardingDebugPanel />
      </SidebarProvider>
    </OnboardingWrapper>
  )
}