# Mobile SDK Integration Guide

## Overview

This guide covers integrating Formbricks with mobile applications using the official mobile SDKs. Mobile integration enables in-app surveys and feedback collection across iOS, Android, and React Native platforms.

---

## React Native Integration

### Prerequisites
- React Native 0.60+
- Node.js 18+
- Formbricks account with Environment ID

### Installation

```bash
# Using npm
npm install @formbricks/react-native

# Using pnpm
pnpm add @formbricks/react-native

# Using yarn
yarn add @formbricks/react-native
```

### Basic Setup

```javascript
// App.js or App.tsx
import React from 'react';
import Formbricks from '@formbricks/react-native';

const config = {
  environmentId: 'your-environment-id',
  appUrl: 'https://app.formbricks.com', // or your self-hosted URL
};

export default function App() {
  return (
    <>
      {/* Your app content */}
      <YourAppComponents />
      
      {/* Formbricks component - should be at the root level */}
      <Formbricks initConfig={config} />
    </>
  );
}
```

### Advanced Configuration

```javascript
// Advanced React Native setup with user attributes
import React, { useEffect } from 'react';
import Formbricks from '@formbricks/react-native';
import { useAuth } from './hooks/useAuth';

const FormbricksProvider = () => {
  const { user } = useAuth();

  const config = {
    environmentId: process.env.EXPO_PUBLIC_FORMBRICKS_ENV_ID,
    appUrl: process.env.EXPO_PUBLIC_FORMBRICKS_APP_URL,
    userId: user?.id,
    attributes: {
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      platform: 'react-native',
      appVersion: '1.0.0',
    },
  };

  return <Formbricks initConfig={config} />;
};

export default function App() {
  return (
    <>
      <YourAppComponents />
      <FormbricksProvider />
    </>
  );
}
```

### Environment Variables (Expo)

```bash
# .env
EXPO_PUBLIC_FORMBRICKS_ENV_ID=your_environment_id
EXPO_PUBLIC_FORMBRICKS_APP_URL=https://app.formbricks.com
```

---

## iOS SDK Integration

### Prerequisites
- iOS 16.6+
- Xcode 14+
- Swift 5.7+

### Installation Options

#### Option 1: Swift Package Manager (Recommended)

1. In Xcode, go to **File → Add Package Dependencies**
2. Enter the repository URL: `https://github.com/formbricks/formbricks-ios`
3. Select the latest version
4. Add to your target

#### Option 2: CocoaPods

```ruby
# Podfile
platform :ios, '16.6'
use_frameworks! :linkage => :static

target 'YourAppName' do
  pod 'FormbricksSDK', '~> 1.0.0'
end
```

Then run:
```bash
pod install
```

### Basic iOS Setup

```swift
// AppDelegate.swift or SceneDelegate.swift
import FormbricksSDK

class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(_ application: UIApplication, 
                    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Initialize Formbricks
        Formbricks.shared.initialize(
            environmentId: "your-environment-id",
            appUrl: "https://app.formbricks.com"
        )
        
        return true
    }
}
```

### SwiftUI Integration

```swift
// ContentView.swift
import SwiftUI
import FormbricksSDK

struct ContentView: View {
    @StateObject private var userManager = UserManager()
    
    var body: some View {
        NavigationView {
            // Your app content
            MainAppView()
        }
        .onAppear {
            setupFormbricks()
        }
    }
    
    private func setupFormbricks() {
        guard let user = userManager.currentUser else { return }
        
        // Set user attributes
        Formbricks.shared.setAttributes([
            "userId": user.id,
            "email": user.email,
            "subscriptionTier": user.subscriptionTier,
            "platform": "ios"
        ])
    }
}
```

### UIKit Integration

```swift
// ViewController.swift
import UIKit
import FormbricksSDK

class ViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set user attributes when view loads
        setUserAttributes()
    }
    
    private func setUserAttributes() {
        let attributes: [String: Any] = [
            "userId": UserDefaults.standard.string(forKey: "userId") ?? "",
            "screenName": "main_dashboard",
            "userTier": "premium"
        ]
        
        Formbricks.shared.setAttributes(attributes)
    }
    
    @IBAction func triggerFeedback(_ sender: UIButton) {
        // Trigger specific survey or feedback
        Formbricks.shared.setAttributes([
            "lastAction": "feedback_requested",
            "actionTime": ISO8601DateFormatter().string(from: Date())
        ])
    }
}
```

---

## Android SDK Integration

### Prerequisites
- Android API Level 21+ (Android 5.0)
- Kotlin 1.8+
- Android Gradle Plugin 7.0+

### Installation

Add to your app-level `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.formbricks:android:1.0.0")
}
```

Enable DataBinding in your `build.gradle.kts`:

```kotlin
android {
    buildFeatures {
        dataBinding = true
    }
}
```

### Basic Android Setup

```kotlin
// Application.kt
import android.app.Application
import com.formbricks.android.Formbricks

class MyApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize Formbricks
        Formbricks.initialize(
            context = this,
            environmentId = "your-environment-id",
            appUrl = "https://app.formbricks.com"
        )
    }
}
```

Don't forget to register your Application class in `AndroidManifest.xml`:

```xml
<application
    android:name=".MyApplication"
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:theme="@style/AppTheme">
    
    <!-- Your activities -->
    
</application>
```

### Activity Integration

```kotlin
// MainActivity.kt
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import com.formbricks.android.Formbricks

class MainActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        setupFormbricks()
    }
    
    private fun setupFormbricks() {
        // Set user attributes
        val attributes = mapOf(
            "userId" to getCurrentUserId(),
            "email" to getCurrentUserEmail(),
            "subscriptionTier" to getCurrentUserTier(),
            "platform" to "android",
            "screenName" to "main_activity"
        )
        
        Formbricks.setAttributes(attributes)
    }
    
    private fun getCurrentUserId(): String {
        // Your user ID logic
        return "user_123"
    }
    
    private fun getCurrentUserEmail(): String {
        // Your user email logic
        return "user@example.com"
    }
    
    private fun getCurrentUserTier(): String {
        // Your user tier logic
        return "premium"
    }
}
```

### Fragment Integration

```kotlin
// DashboardFragment.kt
import androidx.fragment.app.Fragment
import android.os.Bundle
import android.view.View
import com.formbricks.android.Formbricks

class DashboardFragment : Fragment() {
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Track fragment view
        Formbricks.setAttributes(mapOf(
            "lastScreen" to "dashboard",
            "screenViewTime" to System.currentTimeMillis().toString()
        ))
    }
    
    private fun onQuoteCreated() {
        // Track quote creation
        Formbricks.setAttributes(mapOf(
            "lastAction" to "quote_created",
            "actionTime" to System.currentTimeMillis().toString(),
            "quotesCreated" to getQuoteCount().toString()
        ))
    }
    
    private fun getQuoteCount(): Int {
        // Your quote count logic
        return 5
    }
}
```

---

## Cross-Platform Best Practices

### 1. Consistent User Attributes

Ensure consistent attribute naming across platforms:

```javascript
// Standard attributes across all platforms
const standardAttributes = {
  userId: user.id,
  email: user.email,
  subscriptionTier: user.tier, // 'free', 'premium', 'enterprise'
  platform: 'ios' | 'android' | 'react-native',
  appVersion: '1.0.0',
  quotesCreated: user.stats.totalQuotes,
  lastLoginDate: user.lastLogin.toISOString(),
  userSegment: 'new' | 'active' | 'power_user',
};
```

### 2. Survey Targeting Strategy

Create platform-specific surveys or use conditional logic:

```yaml
# Survey targeting examples
Mobile Dashboard Survey:
  Trigger: screenName = "dashboard"
  Platforms: ["ios", "android", "react-native"]
  
iOS Specific Survey:
  Trigger: platform = "ios" AND appVersion >= "1.0.0"
  
Quote Creation Survey:
  Trigger: lastAction = "quote_created"
  Platforms: ["all"]
```

### 3. Performance Considerations

```javascript
// Lazy loading for React Native
const FormbricksProvider = React.lazy(() => 
  import('@formbricks/react-native').then(module => ({
    default: module.default
  }))
);

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <FormbricksProvider config={config} />
</Suspense>
```

### 4. Error Handling

```swift
// iOS Error Handling
do {
    try Formbricks.shared.setAttributes(attributes)
} catch {
    print("Formbricks error: \(error.localizedDescription)")
    // Graceful degradation - app continues to work
}
```

```kotlin
// Android Error Handling
try {
    Formbricks.setAttributes(attributes)
} catch (e: Exception) {
    Log.e("Formbricks", "Error setting attributes", e)
    // Graceful degradation - app continues to work
}
```

---

## Testing Mobile Integration

### React Native Testing

```javascript
// __tests__/FormbricksIntegration.test.js
import { render } from '@testing-library/react-native';
import Formbricks from '@formbricks/react-native';

jest.mock('@formbricks/react-native', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe('Formbricks Integration', () => {
  it('should initialize with correct config', () => {
    const config = {
      environmentId: 'test-env-id',
      appUrl: 'https://test.formbricks.com',
    };
    
    render(<Formbricks initConfig={config} />);
    
    expect(Formbricks).toHaveBeenCalledWith(
      expect.objectContaining({ initConfig: config }),
      expect.anything()
    );
  });
});
```

### iOS Testing

```swift
// FormbricksTests.swift
import XCTest
@testable import YourApp
@testable import FormbricksSDK

class FormbricksTests: XCTestCase {
    
    func testFormbricksInitialization() {
        // Test initialization
        let expectation = XCTestExpectation(description: "Formbricks initialized")
        
        Formbricks.shared.initialize(
            environmentId: "test-env-id",
            appUrl: "https://test.formbricks.com"
        )
        
        // Verify initialization
        XCTAssertTrue(Formbricks.shared.isInitialized)
        expectation.fulfill()
        
        wait(for: [expectation], timeout: 5.0)
    }
}
```

### Android Testing

```kotlin
// FormbricksTest.kt
import org.junit.Test
import org.junit.Assert.*
import com.formbricks.android.Formbricks

class FormbricksTest {
    
    @Test
    fun testAttributeSetting() {
        val attributes = mapOf(
            "userId" to "test-user",
            "platform" to "android"
        )
        
        // This would typically be mocked in a real test
        assertDoesNotThrow {
            Formbricks.setAttributes(attributes)
        }
    }
}
```

---

## Troubleshooting

### Common Issues

#### React Native
- **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
- **iOS build errors**: Run `cd ios && pod install` after installation
- **Android build errors**: Ensure DataBinding is enabled

#### iOS
- **Swift Package Manager issues**: Clean build folder and re-add package
- **Runtime crashes**: Check iOS deployment target is 16.6+
- **Missing symbols**: Ensure proper framework linking

#### Android
- **ProGuard/R8 issues**: Add keep rules for Formbricks classes
- **Network security**: Ensure network security config allows HTTPS requests
- **Memory issues**: Monitor for memory leaks in long-running apps

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
// React Native
const config = {
  environmentId: 'your-env-id',
  appUrl: 'https://app.formbricks.com',
  debug: __DEV__, // Enable in development
};
```

```swift
// iOS
#if DEBUG
Formbricks.shared.enableDebugMode()
#endif
```

```kotlin
// Android
if (BuildConfig.DEBUG) {
    Formbricks.enableDebugMode()
}
```

---

## Next Steps

1. **Choose your platform** and follow the appropriate integration guide
2. **Set up surveys** in your Formbricks dashboard with mobile-specific targeting
3. **Test thoroughly** on real devices and simulators
4. **Monitor performance** and survey completion rates
5. **Iterate** based on user feedback and analytics

For web integration, refer to the main [Integration Guide](./05-integration-guide.md).
