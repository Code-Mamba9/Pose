import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useCameraPermissions } from '@/utils/PermissionManager';
import { PermissionDeniedView } from './PermissionDeniedView';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

interface CameraPermissionHandlerProps {
  children: React.ReactNode;
}

export function CameraPermissionHandler({ children }: CameraPermissionHandlerProps) {
  const {
    hasPermission,
    requestPermissions,
    openSettings,
    getPermissionMessage,
    getSettingsInstructions
  } = useCameraPermissions();
  
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDeniedPermanently, setPermissionDeniedPermanently] = useState(false);

  useEffect(() => {
    // Initial permission check
    setIsLoading(false);
  }, [hasPermission]);

  const handleRetryPermission = async () => {
    setIsLoading(true);
    try {
      const result = await requestPermissions();
      
      if (result.status === 'denied' && !result.canAskAgain) {
        setPermissionDeniedPermanently(true);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    await openSettings();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Checking camera permissions...</ThemedText>
      </ThemedView>
    );
  }

  if (!hasPermission) {
    return (
      <PermissionDeniedView
        permissionType="camera"
        message={getPermissionMessage()}
        settingsInstructions={getSettingsInstructions()}
        onRetry={handleRetryPermission}
        onOpenSettings={handleOpenSettings}
        canRetry={!permissionDeniedPermanently}
      />
    );
  }

  // Permission granted - render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});