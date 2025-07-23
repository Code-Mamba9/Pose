import { Camera } from 'react-native-vision-camera';
import { PermissionManager, PermissionResult } from '@/utils/PermissionManager';

export interface CameraServiceError {
  code: string;
  message: string;
}

export class CameraService {
  private static isInitialized = false;
  private static currentCamera: any = null;

  /**
   * Check if camera permissions are granted
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      const devices = Camera.getAvailableCameraDevices();
      return devices.length > 0;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }

  /**
   * Request camera permissions
   * Note: This should be used in conjunction with the useCameraPermissions hook
   */
  static async requestPermissions(): Promise<PermissionResult> {
    try {
      // This is a simplified version - actual implementation should use the hook
      const hasPermission = await this.checkPermissions();
      return {
        status: hasPermission ? 'granted' : 'denied',
        canAskAgain: !hasPermission
      };
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return { status: 'denied', canAskAgain: false };
    }
  }

  /**
   * Get available camera devices
   */
  static getAvailableCameraDevices() {
    try {
      return Camera.getAvailableCameraDevices();
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  /**
   * Get best camera device for pose detection
   */
  static getBestCameraDevice(position: 'front' | 'back' = 'back') {
    try {
      const devices = this.getAvailableCameraDevices();
      
      // Find the best camera device for the specified position
      const device = devices.find(d => d.position === position);
      
      if (!device) {
        throw new Error(`No ${position} camera found`);
      }
      
      return device;
    } catch (error) {
      console.error('Error getting best camera device:', error);
      return null;
    }
  }

  /**
   * Initialize camera service
   */
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error('Camera permissions not granted');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing camera service:', error);
      throw error;
    }
  }

  /**
   * Start camera (placeholder for future camera component integration)
   */
  static async startCamera(): Promise<void> {
    try {
      await this.initialize();
      console.log('Camera service started');
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  }

  /**
   * Stop camera
   */
  static async stopCamera(): Promise<void> {
    try {
      this.currentCamera = null;
      console.log('Camera service stopped');
    } catch (error) {
      console.error('Error stopping camera:', error);
      throw error;
    }
  }

  /**
   * Handle permission errors with user-friendly messages
   */
  static handlePermissionError(error: any): CameraServiceError {
    if (error.code === 'permission/camera-permission-denied') {
      return {
        code: 'CAMERA_PERMISSION_DENIED',
        message: 'Camera permission is required for pose detection. Please grant camera access in your device settings.'
      };
    }
    
    if (error.code === 'device/no-device') {
      return {
        code: 'NO_CAMERA_DEVICE',
        message: 'No camera device is available on this device.'
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while accessing the camera.'
    };
  }
}