import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useModelManager } from '../hooks/useModelManager';
import { ModelConfig } from '../services/ModelManager';

// MoveNet Lightning model configuration
const MOVENET_CONFIG: ModelConfig = {
  modelPath: require('../../assets/models/movenet_lightning_f16.tflite'),
  enableGPU: true,
  inputSize: 192,
  outputShape: [1, 1, 17, 3], // [batch, instances, keypoints, coordinates]
};

/**
 * Test component to verify model loading and initialization
 * This can be used to validate the ModelManager implementation
 */
export function ModelTest() {
  const { model, loading, error, metrics, ready, initializeModel, dispose } = 
    useModelManager(null); // Start without auto-initialization

  const handleInitialize = async () => {
    try {
      console.log('Starting model initialization...');
      await initializeModel(MOVENET_CONFIG);
      Alert.alert('Success', 'Model initialized successfully!');
    } catch (error) {
      console.error('Model initialization failed:', error);
      Alert.alert('Error', `Model initialization failed: ${error}`);
    }
  };

  const handleTestInference = () => {
    if (!model || !ready) {
      Alert.alert('Error', 'Model not ready for inference');
      return;
    }

    try {
      // Create dummy input data (192x192x3 RGB image)
      // MoveNet model expects uint8 values (0-255)
      const inputSize = 192 * 192 * 3;
      const dummyInput = new Uint8Array(inputSize);
      
      // Fill with uint8 values (0-255)
      for (let i = 0; i < inputSize; i++) {
        dummyInput[i] = Math.floor(Math.random() * 256); // 0-255 range
      }

      console.log('Running test inference...');
      const startTime = Date.now();
      const outputs = model.runInference(dummyInput);
      const inferenceTime = Date.now() - startTime;

      console.log('Inference completed:', {
        inferenceTime: `${inferenceTime}ms`,
        outputShape: outputs.map(o => o.length),
        outputSample: outputs[0]?.slice(0, 10), // First 10 values
      });

      Alert.alert(
        'Inference Success', 
        `Inference completed in ${inferenceTime}ms\n` +
        `Output shape: ${outputs.map(o => o.length).join(', ')}`
      );
    } catch (error) {
      console.error('Inference failed:', error);
      Alert.alert('Error', `Inference failed: ${error}`);
    }
  };

  const handleDispose = () => {
    dispose();
    Alert.alert('Success', 'Model disposed successfully');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Model Manager Test</Text>
      
      {/* Status Display */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {loading ? 'Loading...' : ready ? 'Ready' : 'Not Initialized'}
        </Text>
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
        {metrics && (
          <View style={styles.metricsContainer}>
            <Text style={styles.metricsText}>Load Time: {metrics.loadTime}ms</Text>
            <Text style={styles.metricsText}>GPU Enabled: {metrics.gpuEnabled ? 'Yes' : 'No'}</Text>
            <Text style={styles.metricsText}>Delegate: {metrics.delegate}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleInitialize}
          disabled={loading || ready}
        >
          <Text style={styles.buttonText}>Initialize Model</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!ready || loading) && styles.buttonDisabled]}
          onPress={handleTestInference}
          disabled={!ready || loading}
        >
          <Text style={styles.buttonText}>Test Inference</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.disposeButton, !ready && styles.buttonDisabled]}
          onPress={handleDispose}
          disabled={!ready}
        >
          <Text style={[styles.buttonText, styles.disposeButtonText]}>Dispose Model</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 5,
  },
  metricsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  metricsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disposeButton: {
    backgroundColor: '#e74c3c',
  },
  disposeButtonText: {
    color: '#fff',
  },
});