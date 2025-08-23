import "@/styles/driver-tour.css"

import { TourTestComponent } from "@/components/debug/TourTestComponent"
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
      <SidebarProvider 
        defaultOpen={true}
        className="sidebar-provider"
        style={{
          '--sidebar-width': '16rem',
          '--sidebar-width-mobile': '18rem',
          '--sidebar-width-icon': '3rem',
        } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="bg-light-concrete transition-all duration-200 ease-linear">
          <AppHeader />
          <div className="flex flex-1 flex-col p-4 min-h-[calc(100vh-4rem)]">
            {children}
          </div>
        </SidebarInset>
        <OnboardingManager autoStartWelcome={true} enableTierBasedTours={true} debugMode={true} />
        <OnboardingDebugPanel />
        <TourTestComponent />
      </SidebarProvider>
    </OnboardingWrapper>
  )
}