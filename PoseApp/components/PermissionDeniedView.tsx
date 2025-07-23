import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PermissionDeniedViewProps {
  permissionType: 'camera' | 'microphone';
  message: string;
  settingsInstructions: string;
  onRetry: () => void;
  onOpenSettings: () => void;
  canRetry?: boolean;
}

export function PermissionDeniedView({
  permissionType,
  message,
  settingsInstructions,
  onRetry,
  onOpenSettings,
  canRetry = true
}: PermissionDeniedViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIcon = () => {
    switch (permissionType) {
      case 'camera':
        return '📷';
      case 'microphone':
        return '🎤';
      default:
        return '⚠️';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.icon}>{getIcon()}</ThemedText>
        
        <ThemedText style={styles.title}>
          {permissionType === 'camera' ? 'Camera Access Required' : 'Microphone Access Required'}
        </ThemedText>
        
        <ThemedText style={styles.message}>
          {message}
        </ThemedText>
        
        <ThemedText style={[styles.instructions, { color: colors.tabIconDefault }]}>
          {settingsInstructions}
        </ThemedText>
        
        <View style={styles.buttonContainer}>
          {canRetry && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton, { borderColor: colors.tint }]}
              onPress={onRetry}
            >
              <ThemedText style={[styles.buttonText, { color: colors.tint }]}>
                Try Again
              </ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.settingsButton, { backgroundColor: colors.tint }]}
            onPress={onOpenSettings}
          >
            <ThemedText style={[styles.buttonText, styles.settingsButtonText]}>
              Open Settings
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  settingsButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsButtonText: {
    color: 'white',
  },
});