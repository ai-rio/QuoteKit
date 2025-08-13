// Debug utilities for onboarding system
// Use these in the browser console to debug onboarding issues

const STORAGE_KEY = 'quotekit-onboarding';
const SESSION_STORAGE_KEY = 'quotekit-onboarding-session';

export const onboardingDebug = {
  // Get current localStorage state
  getLocalStorageState: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Invalid localStorage data:', error);
      return null;
    }
  },

  // Get current sessionStorage state
  getSessionStorageState: () => {
    const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Invalid sessionStorage data:', error);
      return null;
    }
  },

  // Clear all onboarding localStorage
  clearLocalStorage: () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('✅ Cleared onboarding localStorage and sessionStorage');
  },

  // Check for phantom active tour
  checkForPhantomActiveTour: () => {
    const state = onboardingDebug.getLocalStorageState();
    if (!state) {
      console.log('ℹ️ No localStorage state found');
      return false;
    }

    console.log('📊 Current onboarding state:', state);
    
    if (state.activeTour) {
      console.log('⚠️ Found activeTour in localStorage:', state.activeTour);
      
      if (!state.activeTour.tourId) {
        console.log('🔥 PHANTOM TOUR: activeTour exists but has no tourId!');
        return true;
      }
      
      if (!state.activeTour.startedAt || !state.activeTour.lastActiveAt) {
        console.log('🔥 CORRUPTED TOUR: activeTour missing required fields!');
        return true;
      }
      
      console.log('✅ activeTour appears valid');
    } else {
      console.log('✅ No activeTour found');
    }
    
    return false;
  },

  // Clear phantom active tour from localStorage
  clearPhantomActiveTour: () => {
    const state = onboardingDebug.getLocalStorageState();
    if (state?.activeTour) {
      state.activeTour = undefined;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('🔧 Cleared activeTour from localStorage');
    } else {
      console.log('ℹ️ No activeTour to clear');
    }
  },

  // Reset to fresh state for testing
  resetToFreshState: (userId: string) => {
    const freshState = {
      userId,
      hasSeenWelcome: false,
      completedTours: [],
      skippedTours: [],
      activeTour: undefined,
      tourProgresses: {},
      sessionCount: 0,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('🔄 Reset to fresh onboarding state:', freshState);
  },

  // Check auto-start conditions
  checkAutoStartConditions: (userInfo?: { id?: string; tier?: string }) => {
    console.log('🎯 Checking auto-start conditions:');
    
    const state = onboardingDebug.getLocalStorageState();
    const hasActiveTour = !!state?.activeTour;
    const hasSeenWelcome = !!state?.hasSeenWelcome;
    const hasCompletedTours = (state?.completedTours?.length || 0) > 0;
    const pathname = window.location.pathname;
    
    console.log('  hasActiveTour:', hasActiveTour);
    console.log('  hasSeenWelcome:', hasSeenWelcome);
    console.log('  hasCompletedTours:', hasCompletedTours);
    console.log('  pathname:', pathname);
    console.log('  userInfo:', userInfo);
    
    const shouldAutoStart = !hasActiveTour && 
                          !hasSeenWelcome && 
                          !hasCompletedTours && 
                          pathname === '/dashboard';
    
    console.log('  shouldAutoStart:', shouldAutoStart);
    
    if (!shouldAutoStart) {
      console.log('❌ Auto-start blocked by:');
      if (hasActiveTour) console.log('    - Active tour exists');
      if (hasSeenWelcome) console.log('    - Already seen welcome');
      if (hasCompletedTours) console.log('    - Has completed tours');
      if (pathname !== '/dashboard') console.log('    - Not on dashboard page');
    }
    
    return shouldAutoStart;
  }
};

// Make available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).onboardingDebug = onboardingDebug;
  console.log('🐛 Onboarding debug utilities available at window.onboardingDebug');
}