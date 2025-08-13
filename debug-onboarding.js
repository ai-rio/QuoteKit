// Quick debug script for testing onboarding
// Run this in browser console on /dashboard page

console.log('🐛 Onboarding Debug Helper Loaded');

// Check if onboarding debug is available
if (window.onboardingDebug) {
  console.log('✅ onboardingDebug available');
  
  // Check auto-start conditions
  window.onboardingDebug.checkAutoStartConditions();
  
  // Check for phantom tours
  window.onboardingDebug.checkForPhantomActiveTour();
} else {
  console.log('❌ onboardingDebug not found');
}

// Try to trigger manual onboarding if auto-start fails
function manualTriggerOnboarding() {
  // Look for tour manager
  if (window.tourManager) {
    console.log('🎯 Found tourManager, attempting manual start...');
    window.tourManager.startTour();
  } else {
    console.log('❌ tourManager not found on window');
  }
}

// Expose manual trigger
window.manualTriggerOnboarding = manualTriggerOnboarding;

console.log('🔧 Run window.manualTriggerOnboarding() to manually start tour');