# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
The React Native app is under Pose/PoseApp, not the project root dir.
This is React Native Expo project. Prioritize expo specific cmds over npm cmds.

This is an Expo React Native application called "Pose" built with:
- **Framework**: Expo SDK ~53.0.17 with React Native 0.79.5 and React 19.0.0
- **Language**: TypeScript with strict mode enabled
- **Routing**: Expo Router with file-based routing and typed routes
- **Navigation**: React Navigation with bottom tabs
- **UI**: Custom themed components with automatic dark/light mode support
- **Architecture**: Uses Expo's new architecture (newArchEnabled: true)

## Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (provides options for iOS, Android, web)
npx expo start

# Platform-specific starts
npm run android    # Start on Android
npm run ios        # Start on iOS  
npm run web        # Start on web

# Linting
npm run lint       # Uses expo lint with ESLint config
```

### Project Reset
```bash
npm run reset-project  # Moves starter code to app-example/ and creates blank app/
```

## Architecture

### Complete File Structure
```
PoseApp/
├── Configuration Files
│   ├── app.json                     # Expo app configuration
│   ├── package.json                 # Dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration with path aliases
│   ├── babel.config.js             # Babel configuration
│   ├── metro.config.js             # Metro bundler configuration
│   ├── eslint.config.js            # ESLint configuration
│   └── expo-env.d.ts               # Expo TypeScript declarations
│
├── Application Code (app/)
│   ├── _layout.tsx                 # Root layout with theme provider and navigation
│   ├── +not-found.tsx              # 404 error page
│   ├── (tabs)/                     # Tab-based routing
│   │   ├── _layout.tsx             # Tab layout configuration (2 tabs: home, explore)
│   │   ├── index.tsx               # Home tab screen
│   │   └── explore.tsx             # Explore tab screen (imports from screens/)
│
├── UI Components (components/)
│   ├── Camera Components/
│   │   ├── CameraPermissionHandler.tsx # Permission management
│   │   └── PermissionDeniedView.tsx # Permission denied UI
│   ├── UI Framework/
│   │   ├── ThemedText.tsx          # Themed text component
│   │   ├── ThemedView.tsx          # Themed view component
│   │   ├── Collapsible.tsx         # Collapsible section component
│   │   ├── ParallaxScrollView.tsx  # Parallax scroll component
│   │   ├── HapticTab.tsx           # Tab with haptic feedback
│   │   ├── HelloWave.tsx           # Animated wave component
│   │   └── ExternalLink.tsx        # External link component
│   ├── Platform-Specific (ui/)
│   │   ├── IconSymbol.tsx/.ios.tsx # Platform-specific icons
│   │   ├── TabBarBackground.tsx/.ios.tsx # Tab bar styling
│   │   └── index.ts                # UI components barrel export
│   └── index.ts                    # Main components barrel export
│
├── Business Logic
│   └── Utilities (utils/)
│       ├── index.ts                # Utils barrel export with common utility functions
│       └── PermissionManager.ts    # Device permissions management
│
├── Screens (screens/)
│   └── PoseDetectionTestScreen.tsx     # Pose detection pipeline test screen
│
├── Configuration & Types
│   ├── Constants (constants/)
│   │   ├── index.ts                # Constants barrel export
│   │   ├── Colors.ts               # Color scheme definitions
│   │   └── paint.ts                # MoveNet keypoint indices and pose connections
│   └── Hooks (hooks/)
│       ├── index.ts                # Hooks barrel export
│       ├── useColorScheme.ts/.web.ts # Color scheme detection
│       └── useThemeColor.ts        # Theme color management
│
├── Assets (assets/)
│   ├── fonts/
│   │   └── SpaceMono-Regular.ttf   # Custom font
│   ├── images/                     # App icons, logos, splash screens
│   │   ├── icon.png, adaptive-icon.png, favicon.png
│   │   ├── splash-icon.png
│   │   └── react-logo*.png         # React logos (various sizes)
│   └── models/
│       ├── movenet_lightning_f16.tflite # TensorFlow Lite pose detection model
│       └── movenet_thunder.tflite        # TensorFlow Lite thunder variant model
│
├── Platform-Specific
│   ├── Android (android/)
│   │   ├── app/
│   │   │   ├── build.gradle        # Android build configuration
│   │   │   ├── src/main/AndroidManifest.xml # App permissions and config
│   │   │   └── debug.keystore      # Debug signing key
│   │   ├── build.gradle            # Project-level build config
│   │   ├── gradle.properties       # Gradle properties
│   │   └── settings.gradle         # Project settings
│   │
│   └── iOS (ios/)
│       ├── Podfile                 # CocoaPods dependencies
│       ├── Podfile.lock           # Locked dependency versions
│       ├── Pose.xcodeproj/        # Xcode project files
│       ├── Pose.xcworkspace/      # Xcode workspace
│       └── Pose/                  # iOS app bundle
│           ├── AppDelegate.swift   # iOS app delegate
│           ├── Info.plist         # iOS app configuration
│           ├── Pose.entitlements  # iOS app capabilities
│           └── PrivacyInfo.xcprivacy # iOS privacy manifest
│
├── Development Tools
│   └── scripts/
│       └── reset-project.js        # Project reset utility
│
└── Generated/Build Artifacts
    ├── .expo/                      # Expo build cache and metadata
    ├── node_modules/               # NPM dependencies
    ├── ios/Pods/                  # CocoaPods dependencies
    ├── ios/build/                 # iOS build artifacts
    └── android/build/             # Android build artifacts
```

### Key Architecture Patterns

#### Core Technologies
- **ML/AI Stack**: TensorFlow Lite with MoveNet model for pose detection
- **Camera Integration**: react-native-vision-camera with resize-plugin

#### ML Pipeline Architecture
- **Model Inference**: TensorFlow Lite MoveNet integration using `react-native-fast-tflite` 
- **Keypoint Extraction**: 17-point human pose keypoint detection and processing
- **Frame Processing**: Real-time frame processing using `react-native-vision-camera` with its resize plugin

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Expo TypeScript base configuration
- Comprehensive path mapping for all directories:
  - `@/*` → project root
  - `@/components/*` → components directory
  - `@/hooks/*` → hooks directory  
  - `@/constants/*` → constants directory
  - `@/utils/*` → utils directory
  - `@/screens/*` → screens directory
  - `@/assets/*` → assets directory
- Includes .expo/types for Expo-specific types

### Development Notes
- **Platform Support**: iOS, Android, and web platforms with platform-specific optimizations
- **Build System**: Metro bundler for web builds with static output
- **UI/UX**: Edge-to-edge enabled for Android, tablet support for iOS
- **Theming**: Automatic UI style switching (light/dark mode) with React Navigation themes
- **Performance**: New Architecture enabled (newArchEnabled: true) for improved performance
- **Camera Permissions**: Configured for both iOS and Android with appropriate usage descriptions
- **Development Tools**: 
  - ESLint with Expo configuration
  - Prettier for code formatting
  - Husky for git hooks
  - TypeScript strict mode
- **Key Dependencies**:
  - `react-native-vision-camera` ^4.7.1 - Camera integration
  - `react-native-fast-tflite` ^1.6.1 - TensorFlow Lite integration
  - `react-native-worklets-core` ^1.6.0 - High-performance worklets
  - `vision-camera-resize-plugin` ^3.2.0 - Camera frame resizing
  - `react-native-reanimated` ~3.17.4 - Animations and worklets



