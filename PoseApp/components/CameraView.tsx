import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { CameraPermissionHandler } from './CameraPermissionHandler';
import { useCameraPermissions } from '@/utils/PermissionManager';
import { useAdvancedFrameProcessor } from '@/utils/frameProcessor';

interface CameraViewProps {
  onCameraReady?: () => void;
  onCameraError?: (error: any) => void;
  onFrameProcessed?: (frameData: any) => void;
  enableFrameProcessor?: boolean;
  frameProcessorConfig?: {
    targetFps?: number;
    enableMetrics?: boolean;
    enableAsyncProcessing?: boolean;
    logFrameInfo?: boolean;
    enableMemoryOptimization?: boolean;
    enableFrameSkipping?: boolean;
    memoryThreshold?: number;
  };
  style?: any;
}

type CameraPosition = 'front' | 'back';

export function CameraView({ 
  onCameraReady, 
  onCameraError, 
  onFrameProcessed,
  enableFrameProcessor = true,
  frameProcessorConfig = {},
  style 
}: CameraViewProps) {
  const cameraRef = useRef<Camera>(null);
  const [isActive, setIsActive] = useState(true);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
  const [isInitialized, setIsInitialized] = useState(false);
  const [frameProcessorEnabled, setFrameProcessorEnabled] = useState(enableFrameProcessor);
  const { hasPermission } = useCameraPermissions();

  // Frame processor setup
  const defaultConfig = {
    targetFps: 25,
    enableMetrics: true,
    enableAsyncProcessing: false,
    logFrameInfo: true, // Enable detailed logging by default
    enableMemoryOptimization: true,
    enableFrameSkipping: true,
    memoryThreshold: 50,
    ...frameProcessorConfig
  };
  
  const { frameProcessor, getMetrics, sharedValues } = useAdvancedFrameProcessor(defaultConfig);

  // Handle frame processing results
  useEffect(() => {
    if (onFrameProcessed && frameProcessorEnabled) {
      const interval = setInterval(() => {
        const metrics = getMetrics();
        onFrameProcessed(metrics);
      }, 1000); // Update metrics every second

      return () => clearInterval(interval);
    }
    return undefined;
  }, [onFrameProcessed, frameProcessorEnabled, getMetrics]);

  // Get the best camera device for pose detection with intelligent fallback
  const device = useCameraDevice(cameraPosition, {
    physicalDevices: ['wide-angle-camera'] // Single lens for faster initialization
  });

  // Auto-fallback: If back camera not found (e.g., simulator), try front camera
  const frontDevice = useCameraDevice('front', {
    physicalDevices: ['wide-angle-camera']
  });

  // Use back camera if available, otherwise fallback to front camera
  const selectedDevice = device || (cameraPosition === 'back' ? frontDevice : null);

  // Auto-switch to front camera if back camera was requested but not available
  useEffect(() => {
    if (cameraPosition === 'back' && !device && frontDevice) {
      console.log('Back camera not available, automatically switching to front camera');
      setCameraPosition('front');
    }
  }, [device, frontDevice, cameraPosition]);

  // Get optimized camera format for pose detection
  const format = useCameraFormat(selectedDevice || undefined, [
    { fps: 30 }, // Target 30 FPS for good performance
    { videoResolution: { width: 1280, height: 720 } } // 720p for good quality/performance balance
  ]);

  // Camera lifecycle handlers
  const handleCameraInitialized = useCallback(() => {
    console.log('Camera initialized');
    setIsInitialized(true);
    onCameraReady?.();
  }, [onCameraReady]);

  const handleCameraError = useCallback((error: any) => {
    console.error('Camera error:', error);
    Alert.alert(
      'Camera Error',
      `Failed to initialize camera: ${error.message}`,
      [{ text: 'OK' }]
    );
    onCameraError?.(error);
  }, [onCameraError]);

  const handleCameraStarted = useCallback(() => {
    console.log('Camera started');
  }, []);

  const handleCameraStopped = useCallback(() => {
    console.log('Camera stopped');
  }, []);

  // Camera control methods
  const startCamera = useCallback(() => {
    setIsActive(true);
  }, []);

  const stopCamera = useCallback(() => {
    setIsActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    setCameraPosition(prev => prev === 'back' ? 'front' : 'back');
  }, []);

  const toggleFrameProcessor = useCallback(() => {
    setFrameProcessorEnabled(prev => {
      const newState = !prev;
      console.log(`🔄 [CameraView] Frame Processor ${newState ? 'ENABLED' : 'DISABLED'}`);
      if (newState) {
        console.log('📹 [CameraView] Now processing camera frames in real-time!');
      } else {
        console.log('⏸️ [CameraView] Frame processing stopped');
      }
      return newState;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsActive(false);
    };
  }, []);

  // Handle device not available
  if (!selectedDevice) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Camera Not Available</ThemedText>
          <ThemedText style={styles.errorMessage}>
            No camera found on this device. {'\n'}
            {Platform.OS === 'ios' ? 'Try testing on a physical device or check iOS Simulator camera settings.' : 'Check device camera permissions and availability.'}
          </ThemedText>
          {cameraPosition === 'front' && (
            <TouchableOpacity style={styles.switchButton} onPress={switchCamera}>
              <ThemedText style={styles.switchButtonText}>Try Back Camera</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <CameraPermissionHandler>
      <View style={[styles.container, style]}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={selectedDevice}
          format={format}
          isActive={isActive && hasPermission}
          // Optimized settings for pose detection
          fps={30}
          lowLightBoost={false} // Disable low light boost
          videoStabilizationMode="off" // Disable stabilization for performance
          enableZoomGesture={false} // Disable zoom for consistent processing
          // Frame processor for real-time processing
          frameProcessor={frameProcessorEnabled ? frameProcessor : undefined}
          // Lifecycle callbacks
          onInitialized={handleCameraInitialized}
          onError={handleCameraError}
          onStarted={handleCameraStarted}
          onStopped={handleCameraStopped}
        />
        
        {/* Camera Controls Overlay */}
        <View style={styles.controlsOverlay}>
          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: isInitialized ? '#4CAF50' : '#FF9800' }
            ]} />
            <ThemedText style={styles.statusText}>
              {isInitialized ? 'Camera Ready' : 'Initializing...'}
            </ThemedText>
            {frameProcessorEnabled && (
              <View style={[styles.statusIndicator, { backgroundColor: '#2196F3', marginLeft: 8 }]} />
            )}
          </View>

          {/* Camera Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={isActive ? stopCamera : startCamera}
            >
              <ThemedText style={styles.controlButtonText}>
                {isActive ? 'Stop' : 'Start'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={switchCamera}
            >
              <ThemedText style={styles.controlButtonText}>
                Switch ({cameraPosition})
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.controlButton, 
                { backgroundColor: frameProcessorEnabled ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
              ]} 
              onPress={toggleFrameProcessor}
            >
              <ThemedText style={[
                styles.controlButtonText,
                { color: frameProcessorEnabled ? 'white' : 'black' }
              ]}>
                Frame Proc {frameProcessorEnabled ? 'ON' : 'OFF'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </CameraPermissionHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    flex: 1,
    maxWidth: 120,
  },
  controlButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  switchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});