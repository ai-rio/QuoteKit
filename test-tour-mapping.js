/**
 * Test script to verify tour mapping is correct
 * Run this in browser console to test the page-tour mapping
 */

console.log('🧪 Testing Tour Mapping...')

// Available tours from TOUR_CONFIGS
const AVAILABLE_TOURS = [
  'welcome',
  'quote-creation', 
  'settings',
  'item-library',
  'pro-features',
  'contextual-help',
  'freemium-highlights',
  'interactive-tutorial',
  'personalized-onboarding'
]

// Test page mappings
const TEST_PAGES = [
  { path: '/dashboard', expectedTour: 'welcome' },
  { path: '/quotes', expectedTour: 'quote-creation' },
  { path: '/quotes/new', expectedTour: 'quote-creation' },
  { path: '/quotes/123', expectedTour: 'quote-creation' },
  { path: '/quotes/123/edit', expectedTour: 'quote-creation' },
  { path: '/items', expectedTour: 'item-library' },
  { path: '/settings', expectedTour: 'settings' },
  { path: '/analytics', expectedTour: 'pro-features' },
  { path: '/clients', expectedTour: 'welcome' },
  { path: '/usage', expectedTour: 'pro-features' }
]

console.group('📋 Tour Mapping Test Results')

TEST_PAGES.forEach(({ path, expectedTour }) => {
  const isAvailable = AVAILABLE_TOURS.includes(expectedTour)
  const status = isAvailable ? '✅' : '❌'
  
  console.log(`${status} ${path} → ${expectedTour} ${isAvailable ? '(Available)' : '(NOT FOUND)'}`)
})

console.groupEnd()

// Summary
const validMappings = TEST_PAGES.filter(({ expectedTour }) => AVAILABLE_TOURS.includes(expectedTour))
const invalidMappings = TEST_PAGES.filter(({ expectedTour }) => !AVAILABLE_TOURS.includes(expectedTour))

console.log('')
console.log(`📊 Summary:`)
console.log(`✅ Valid mappings: ${validMappings.length}/${TEST_PAGES.length}`)
console.log(`❌ Invalid mappings: ${invalidMappings.length}/${TEST_PAGES.length}`)

if (invalidMappings.length > 0) {
  console.log('')
  console.log('❌ Invalid mappings found:')
  invalidMappings.forEach(({ path, expectedTour }) => {
    console.log(`   ${path} → ${expectedTour} (tour not found)`)
  })
} else {
  console.log('')
  console.log('🎉 All tour mappings are valid!')
}

console.log('')
console.log('💡 Available tours:')
AVAILABLE_TOURS.forEach(tour => console.log(`   - ${tour}`))
