/**
 * Navigation helper for onboarding tours
 * Handles client-side navigation without breaking tour state
 */

export interface NavigationHelper {
  navigateToPage: (path: string) => Promise<void>;
  getCurrentPath: () => string;
  isOnPage: (path: string) => boolean;
}

class TourNavigationHelper implements NavigationHelper {
  private router: any = null;

  constructor() {
    // Try to get router from window if available
    if (typeof window !== 'undefined') {
      // Check if Next.js router is available globally
      this.router = (window as any).__NEXT_ROUTER__;
    }
  }

  async navigateToPage(path: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // If we have Next.js router, use it for client-side navigation
    if (this.router && this.router.push) {
      console.log(`🧭 Navigating to ${path} using Next.js router`);
      await this.router.push(path);
      // Wait a bit for the navigation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    // Fallback to window.location for navigation
    console.log(`🧭 Navigating to ${path} using window.location`);
    window.location.href = path;
  }

  getCurrentPath(): string {
    if (typeof window === 'undefined') return '';
    return window.location.pathname;
  }

  isOnPage(path: string): boolean {
    const currentPath = this.getCurrentPath();
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.includes(path);
  }
}

// Export singleton instance
export const navigationHelper = new TourNavigationHelper();

/**
 * Enhanced navigation function for tours that preserves tour state
 */
export async function navigateForTour(targetPath: string, currentPath?: string): Promise<void> {
  const current = currentPath || navigationHelper.getCurrentPath();
  
  // If already on the target page, no navigation needed
  if (navigationHelper.isOnPage(targetPath)) {
    console.log(`🧭 Already on ${targetPath}, skipping navigation`);
    return;
  }

  console.log(`🧭 Navigating from ${current} to ${targetPath} for tour`);
  await navigationHelper.navigateToPage(targetPath);
}

/**
 * Check if user is on the correct page for a tour step
 */
export function validatePageForTour(requiredPath: string): boolean {
  return navigationHelper.isOnPage(requiredPath);
}
