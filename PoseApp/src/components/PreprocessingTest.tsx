import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { preprocessFrameForMoveNet, SimplePreprocessingResult } from '../utils/simplePreprocessor';

interface PreprocessingStats {
  avgProcessingTime: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  frameCount: number;
  errorCount: number;
  lastOutputShape: string;
}

/**
 * Test component for validating image preprocessing pipeline
 * Tests real-time camera frame processing with performance metrics
 */
export function PreprocessingTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<PreprocessingStats>({
    avgProcessingTime: 0,
    minProcessingTime: Infinity,
    maxProcessingTime: 0,
    frameCount: 0,
    errorCount: 0,
    lastOutputShape: 'N/A',
  });

  const device = useCameraDevice('back');

  // Create worklets-core runOnJS functions instead of reanimated's runOnJS
  const updateStatsJS = Worklets.createRunOnJS((processingTime: number, dataLength: number, width: number, height: number, channels: number) => {
    setStats(prevStats => {
      const newFrameCount = prevStats.frameCount + 1;
      const newMinTime = Math.min(prevStats.minProcessingTime === Infinity ? processingTime : prevStats.minProcessingTime, processingTime);
      const newMaxTime = Math.max(prevStats.maxProcessingTime, processingTime);
      const newAvgTime = (prevStats.avgProcessingTime * prevStats.frameCount + processingTime) / newFrameCount;

      return {
        frameCount: newFrameCount,
        avgProcessingTime: newAvgTime,
        minProcessingTime: newMinTime,
        maxProcessingTime: newMaxTime,
        errorCount: prevStats.errorCount,
        lastOutputShape: `${width}×${height}×${channels} (${dataLength} values)`,
      };
    });
  });

  const updateErrorCountJS = Worklets.createRunOnJS(() => {
    setStats(prevStats => ({
      ...prevStats,
      errorCount: prevStats.errorCount + 1,
    }));
  });

  // Frame processor for real-time testing - using worklets-core
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (!isProcessing) return;
    
    try {
      // Process every frame for testing using simple preprocessor
      const result = preprocessFrameForMoveNet(frame);
      
      // Log successful preprocessing
      console.log(`Processed frame: ${result.processingTime}ms, ${result.data.length} bytes`);
      
      // Use worklets-core createRunOnJS instead of reanimated's runOnJS
      updateStatsJS(result.processingTime, result.data.length, result.width, result.height, result.channels);
    } catch (error) {
      console.error('Frame processing error:', error);
      updateErrorCountJS();
    }
  }, [isProcessing, updateStatsJS, updateErrorCountJS]);

  const handleStartProcessing = () => {
    setIsProcessing(true);
    setStats({
      avgProcessingTime: 0,
      minProcessingTime: Infinity,
      maxProcessingTime: 0,
      frameCount: 0,
      errorCount: 0,
      lastOutputShape: 'N/A',
    });
    Alert.alert('Started', 'Frame preprocessing started. Check stats below.');
  };

  const handleStopProcessing = () => {
    setIsProcessing(false);
    Alert.alert('Stopped', 'Frame preprocessing stopped.');
  };

  const handleResetStats = () => {
    setStats({
      avgProcessingTime: 0,
      minProcessingTime: Infinity,
      maxProcessingTime: 0,
      frameCount: 0,
      errorCount: 0,
      lastOutputShape: 'N/A',
    });
  };

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera device available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Preprocessing Test</Text>
      
      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          pixelFormat="yuv" // Optimal for preprocessing
          enableBufferCompression={true}
        />
        
        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingIndicator}>
            <Text style={styles.processingText}>🔄 Processing Frames</Text>
          </View>
        )}
      </View>

      {/* Statistics Display */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Performance Stats</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Frames Processed:</Text>
          <Text style={styles.statValue}>{stats.frameCount}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Average Time:</Text>
          <Text style={styles.statValue}>
            {stats.avgProcessingTime.toFixed(1)}ms
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Min/Max Time:</Text>
          <Text style={styles.statValue}>
            {stats.minProcessingTime === Infinity ? 'N/A' : `${stats.minProcessingTime}ms`} / {stats.maxProcessingTime}ms
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Error Count:</Text>
          <Text style={[styles.statValue, stats.errorCount > 0 && styles.errorValue]}>
            {stats.errorCount}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Output Shape:</Text>
          <Text style={styles.statValue}>{stats.lastOutputShape}</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={handleStartProcessing}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Start Processing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton, !isProcessing && styles.buttonDisabled]}
          onPress={handleStopProcessing}
          disabled={!isProcessing}
        >
          <Text style={styles.buttonText}>Stop Processing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleResetStats}
        >
          <Text style={styles.buttonText}>Reset Stats</Text>
        </TouchableOpacity>
      </View>
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
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  errorValue: {
    color: '#e74c3c',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  resetButton: {
    backgroundColor: '#34C759',
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