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
│   │   ├── _layout.tsx             # Tab layout configuration
│   │   ├── index.tsx               # Home tab screen
│   │   ├── explore.tsx             # Explore tab screen (imports from src/screens/)
│   │   └── test.tsx                # Test screen (imports from src/screens/)
│   └── Test Screens/
│       ├── camera-test.tsx         # Camera integration tests (standalone, not routed)
│       └── model-test.tsx          # ML model testing
│
├── UI Components (components/)
│   ├── Camera Components/
│   │   ├── CameraView.tsx          # Main camera component
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
│   ├── Services (services/)        # App-level services
│   │   ├── index.ts                # Services barrel export
│   │   ├── cameraService.ts        # Camera management service
│   │   ├── poseDetectionService.ts # Mock pose detection (testing)
│   │   ├── postureAnalysisService.ts # Posture analysis logic
│   │   └── storageService.ts       # Data persistence service
│   │
│   ├── Core ML Services (src/services/) # Advanced ML pipeline
│   │   ├── PoseDetectionPipeline.ts # Complete pose detection pipeline
│   │   ├── ImagePreprocessor.ts    # ⚠️ UNUSED - Class-based preprocessing with hardware acceleration
│   │   ├── ImagePreprocessorFunctions.ts # ACTIVE - Functional preprocessing utilities 
│   │   ├── ImagePreprocessorOptimized.ts # Optimized preprocessing
│   │   ├── KeypointExtractor.ts    # Keypoint extraction from model output
│   │   ├── MockMoveNetOutput.ts    # Mock MoveNet model output for testing
│   │   └── ModelManager.ts         # TensorFlow Lite model management
│   │
│   ├── State Management (store/)
│   │   ├── index.ts                # Store barrel export
│   │   ├── appStore.ts             # Global app state (Zustand)
│   │   ├── poseStore.ts            # Pose detection state
│   │   └── userStore.ts            # User data and preferences
│   │
│   └── Utilities (utils/)
│       ├── index.ts                # Utils barrel export
│       ├── frameProcessor.ts       # Advanced frame processing with metrics
│       ├── memoryManager.ts        # Memory optimization and monitoring
│       └── PermissionManager.ts    # Device permissions management
│
├── ML Development (src/)
│   ├── Components (components/)
│   │   ├── ImagePreprocessorDemo.tsx # Preprocessing visualization
│   │   └── ModelTest.tsx           # Model testing interface
│   │
│   ├── Hooks (hooks/)
│   │   ├── useModelManager.ts      # Model management hook
│   │   └── useSafeResizePlugin.ts  # Safe resize plugin hook
│   │
│   ├── Screens (screens/)
│   │   ├── TestPreprocessorScreen.tsx # Preprocessing testing screen
│   │   └── PoseDetectionTestScreen.tsx # Pose detection pipeline test screen
│   │
│   └── Utils (utils/)
│       └── modelLoader.ts          # TensorFlow Lite model loading
│
├── Configuration & Types
│   ├── Types (types/)
│   │   └── index.ts                # Global TypeScript type definitions
│   ├── Constants (constants/)
│   │   ├── index.ts                # Constants barrel export
│   │   └── Colors.ts               # Color scheme definitions
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
│       └── movenet_lightning_f16.tflite # TensorFlow Lite pose detection model
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
- **Camera Integration**: react-native-vision-camera with worklet-based frame processing
- **Image Processing**: YUV to RGB conversion with resize optimization
- **Performance**: Worklet-based processing for 60fps real-time analysis

#### Development Patterns
- **Theme System**: Uses `@react-navigation/native` themes with custom color scheme detection
- **Path Aliases**: Comprehensive `@/*` mapping for clean imports across all directories
- **State Management**: Zustand for lightweight, performant state management
- **Platform Handling**: Platform-specific components and styling (iOS blur effects, etc.)
- **Haptic Feedback**: Custom HapticTab component for enhanced UX
- **Font Loading**: Custom SpaceMono font with async loading handling
- **Error Recovery**: Comprehensive error handling and recovery strategies
- **Memory Management**: Advanced memory optimization for ML workloads

#### ML Pipeline Architecture
- **Preprocessing**: Optimized YUV→RGB conversion with resize plugins
- **Model Inference**: TensorFlow Lite MoveNet integration (currently mocked for testing)  
- **Keypoint Extraction**: 17-point human pose keypoint detection and processing
- **Performance Monitoring**: Real-time FPS, memory usage, and processing time metrics
- **Frame Processing**: Advanced frame processor with adaptive sampling and CPU load management

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Expo TypeScript base configuration
- Comprehensive path mapping for all directories:
  - `@/*` → project root
  - `@/components/*` → components directory
  - `@/hooks/*` → hooks directory  
  - `@/constants/*` → constants directory
  - `@/utils/*` → utils directory
  - `@/types/*` → types directory
  - `@/store/*` → store directory
  - `@/services/*` → services directory
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
  - `zustand` ^5.0.6 - State management
  - `react-native-reanimated` ~3.17.4 - Animations and worklets

## Code Analysis Findings

### Dead Code Identified (2025-01-06)

**Unused Image Preprocessing Implementation:**
- `src/services/ImagePreprocessor.ts` - Complete class-based preprocessor with hardware acceleration support
  - **Status**: UNUSED - No imports found in codebase
  - **Features**: Dual-path processing (hardware + fallback), dependency injection, configuration management
  - **Recommendation**: Safe to delete - sophisticated implementation but completely unused
- `src/hooks/useImagePreprocessor.ts` - React hook wrapper for ImagePreprocessor class
  - **Status**: DELETED - Was unused hook that wrapped unused class
  - **Chain**: ImagePreprocessor.ts → useImagePreprocessor.ts (both unused)

**Active Image Preprocessing Implementation:**
- `src/services/ImagePreprocessorFunctions.ts` - Functional approach currently in use
  - **Import Chain**: `ImagePreprocessorFunctions.ts` → `ImagePreprocessorDemo.tsx` → `TestPreprocessorScreen.tsx`
  - **Pipeline Usage**: Also imported by `PoseDetectionPipeline.ts` for complete ML workflow
  - **Status**: ACTIVE - Core component of current preprocessing architecture

**Code Duplication Issues:**
Both files contain identical implementations (~200+ lines duplicated):
- YUV→RGB conversion algorithms
- Nearest-neighbor resizing logic  
- Aspect ratio calculations
- Data normalization functions

