import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { Linking, Platform } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'not-determined' | 'restricted';

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

export class PermissionManager {
  /**
   * Request camera permission with proper error handling
   */
  static async requestCameraPermission(): Promise<PermissionResult> {
    try {
      // Note: This needs to be called within a component context
      // Will be wrapped by hook-based approach
      return { status: 'not-determined', canAskAgain: true };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return { status: 'denied', canAskAgain: false };
    }
  }

  /**
   * Request microphone permission (optional for video recording)
   */
  static async requestMicrophonePermission(): Promise<PermissionResult> {
    try {
      return { status: 'not-determined', canAskAgain: true };
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return { status: 'denied', canAskAgain: false };
    }
  }

  /**
   * Open device settings for permission management
   */
  static async openSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }

  /**
   * Get user-friendly permission message
   */
  static getPermissionMessage(permissionType: 'camera' | 'microphone'): string {
    switch (permissionType) {
      case 'camera':
        return 'Camera access is required for pose detection. Please grant camera permission to continue.';
      case 'microphone':
        return 'Microphone access is optional for recording videos with audio.';
      default:
        return 'Permission is required to use this feature.';
    }
  }

  /**
   * Get settings instruction message based on platform
   */
  static getSettingsInstructions(): string {
    if (Platform.OS === 'ios') {
      return 'Go to Settings > Privacy & Security > Camera > Pose to enable camera access.';
    } else {
      return 'Go to Settings > Apps > Pose > Permissions > Camera to enable camera access.';
    }
  }
}

/**
 * Hook for managing camera permissions
 */
export const useCameraPermissions = () => {
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  
  const requestPermissions = async (): Promise<PermissionResult> => {
    try {
      const granted = await requestCameraPermission();
      return {
        status: granted ? 'granted' : 'denied',
        canAskAgain: !granted // Simplified logic - in practice, would need more sophisticated tracking
      };
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      return { status: 'denied', canAskAgain: false };
    }
  };

  return {
    hasPermission: hasCameraPermission,
    requestPermissions,
    openSettings: PermissionManager.openSettings,
    getPermissionMessage: () => PermissionManager.getPermissionMessage('camera'),
    getSettingsInstructions: PermissionManager.getSettingsInstructions
  };
};

/**
 * Hook for managing microphone permissions (optional)
 */
export const useMicrophonePermissions = () => {
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
  
  const requestPermissions = async (): Promise<PermissionResult> => {
    try {
      const granted = await requestMicrophonePermission();
      return {
        status: granted ? 'granted' : 'denied',
        canAskAgain: !granted
      };
    } catch (error) {
      console.error('Failed to request microphone permission:', error);
      return { status: 'denied', canAskAgain: false };
    }
  };

  return {
    hasPermission: hasMicrophonePermission,
    requestPermissions,
    openSettings: PermissionManager.openSettings,
    getPermissionMessage: () => PermissionManager.getPermissionMessage('microphone'),
    getSettingsInstructions: PermissionManager.getSettingsInstructions
  };
};