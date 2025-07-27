import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { createMoveNetPreprocessor } from './src/services/ImagePreprocessor';

/**
 * Simple test component for validating worklets setup
 */
export function SimplePreprocessingTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const device = useCameraDevice('back');
  
  // Create preprocessor instance
  const preprocessor = createMoveNetPreprocessor();

  // Simple frame processor worklet
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (isProcessing) {
      try {
        const result = preprocessor.preprocessFrame(frame);
        console.log(`Preprocessed: ${result.width}x${result.height}, ${result.processingTime}ms`);
      } catch (error) {
        console.error('Preprocessing error:', error);
      }
    }
  }, [isProcessing]);

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera device available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Preprocessing Test</Text>
      
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          pixelFormat="yuv"
        />
        
        {isProcessing && (
          <View style={styles.processingIndicator}>
            <Text style={styles.processingText}>🔄 Processing</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsProcessing(!isProcessing)}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? 'Stop Processing' : 'Start Processing'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  cameraContainer: {
    position: 'relative',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  processingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 50,
  },
});