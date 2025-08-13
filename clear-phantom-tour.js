// Manual fix for phantom tour issue
// Run this in browser console on the dashboard page

console.log('🔧 Manual phantom tour cleaner starting...');

// Clear localStorage
const STORAGE_KEY = 'quotekit-onboarding';
const localData = localStorage.getItem(STORAGE_KEY);

if (localData) {
  try {
    const parsed = JSON.parse(localData);
    if (parsed.activeTour) {
      console.log('📊 Found phantom tour:', parsed.activeTour);
      parsed.activeTour = undefined;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      console.log('✅ Cleared activeTour from localStorage');
    } else {
      console.log('ℹ️ No activeTour found in localStorage');
    }
  } catch (error) {
    console.error('❌ Error parsing localStorage:', error);
  }
} else {
  console.log('ℹ️ No onboarding data in localStorage');
}

// Clear sessionStorage
const SESSION_STORAGE_KEY = 'quotekit-onboarding-session';
sessionStorage.removeItem(SESSION_STORAGE_KEY);
console.log('✅ Cleared sessionStorage');

// Force page reload to reinitialize onboarding
console.log('🔄 Reloading page to reinitialize onboarding...');
setTimeout(() => {
  window.location.reload();
}, 1000);