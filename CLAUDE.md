# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

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

### File Structure
- `app/` - Main application code using Expo Router file-based routing
  - `(tabs)/` - Tab-based screens (index.tsx for Home, explore.tsx for Explore)
  - `_layout.tsx` - Root layout with theme provider and stack navigation
- `components/` - Reusable UI components
  - `ui/` - Platform-specific UI components (IconSymbol, TabBarBackground)
  - Themed components (ThemedText, ThemedView) for consistent styling
- `hooks/` - Custom React hooks for theme and color scheme management
- `constants/` - App constants including Colors configuration
- `assets/` - Static assets (fonts, images)

### Key Patterns
- **Theme System**: Uses `@react-navigation/native` themes with custom color scheme detection
- **Path Aliases**: `@/*` maps to project root for clean imports
- **Platform Handling**: Platform-specific components and styling (iOS blur effects, etc.)
- **Haptic Feedback**: Custom HapticTab component for enhanced UX
- **Font Loading**: Custom SpaceMono font with async loading handling

### TypeScript Configuration
- Strict mode enabled
- Expo TypeScript base configuration
- Path mapping configured for `@/*` aliases
- Includes .expo/types for Expo-specific types

### Development Notes
- Project supports iOS, Android, and web platforms
- Uses Metro bundler for web builds with static output
- Edge-to-edge enabled for Android
- Tablet support enabled for iOS
- Automatic UI style switching (light/dark mode)