import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';

/**
 * Very basic test to check if worklets are working at all
 */
export default function SimpleTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const device = useCameraDevice('back');

  // Basic worklet function
  const basicWorklet = (message: string) => {
    'worklet';
    console.log('Basic worklet message:', message);
  };

  // Simple frame processor
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (isProcessing) {
      // Call the basic worklet
      basicWorklet('Frame processed!');
      console.log(`Frame: ${frame.width}x${frame.height}`);
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
      <Text style={styles.title}>Basic Worklet Test</Text>
      
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
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
      
      <Text style={styles.instructions}>
        Check the console for worklet messages when processing is enabled.
      </Text>
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
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 50,
  },
});