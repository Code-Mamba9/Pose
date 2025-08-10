import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';

export default function PoseDetectionTestScreen() {
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef<Camera>(null);

  // Proper camera device selection following react-native-vision-camera best practices
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const model = useTensorflowModel(require('../../assets/models/movenet_lightning_f16.tflite'));
  const poseEstimationModel = model.state === 'loaded' ? model.model : undefined;
  const { resize } = useResizePlugin();
  // Initialize pose detection frame processor with current config and model
  const frameProcessor = useFrameProcessor(
    (frame) => {

      'worklet'
      if (poseEstimationModel == null) return

      const data = resize(frame, {
        scale: {
          width: 192,
          height: 192,
        },
        pixelFormat: 'rgb',
        dataType: 'uint8'
      })
      const output = poseEstimationModel?.runSync([data])

      console.log(`detected ${output}`)
    }
    , [model])


  const handleCameraReady = useCallback(() => {
    console.log('Camera ready for pose detection');
    setIsReady(true);
    console.log('Model state:', model.state);
  }, [model.state]);

  const handleCameraError = useCallback((error: any) => {
    console.error('Camera error:', error);
    setIsReady(false);
  }, []);


  // Handle permission and device states properly
  if (!hasPermission) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Camera Permission Required</ThemedText>
          <ThemedText style={styles.errorMessage}>
            This app needs camera access to perform pose detection.
          </ThemedText>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (device == null) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>No Camera Available</ThemedText>
          <ThemedText style={styles.errorMessage}>
            No camera device found on this device. Try using a physical device instead of the simulator.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={hasPermission}
          frameProcessor={frameProcessor}
          onInitialized={handleCameraReady}
          onError={handleCameraError}
        />

        {/* Status overlay */}
        <View style={styles.statusOverlay}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: isReady ? '#4CAF50' : '#FF9800' }
          ]} />
          <ThemedText style={styles.statusText}>
            {isReady ? 'Pose Detection Active' : 'Initializing Camera'}
          </ThemedText>
        </View>
      </View>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    minHeight: 250,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: 20,
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
    flex: 1,
    maxHeight: '50%',
  },
  configSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  poseSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  fpsControls: {
    flexDirection: 'row',
    gap: 8,
  },
  fpsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fpsButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  fpsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fpsButtonTextActive: {
    color: 'white',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 20,
  },
  smoothingSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructions: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.8,
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
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
