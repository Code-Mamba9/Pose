import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { CameraView } from '@/components/CameraView';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FrameProcessingMetrics } from '@/utils/frameProcessor';

export default function CameraTestScreen() {
  const [metrics, setMetrics] = useState<FrameProcessingMetrics | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleCameraReady = useCallback(() => {
    console.log('Camera ready for frame processing');
    setIsReady(true);
  }, []);

  const handleCameraError = useCallback((error: any) => {
    console.error('Camera error:', error);
  }, []);

  const handleFrameProcessed = useCallback((frameData: FrameProcessingMetrics) => {
    setMetrics(frameData);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          onCameraReady={handleCameraReady}
          onCameraError={handleCameraError}
          onFrameProcessed={handleFrameProcessed}
          enableFrameProcessor={true}
          frameProcessorConfig={{
            targetFps: 25,
            enableMetrics: true,
            enableAsyncProcessing: false,
            logFrameInfo: true,
            enableMemoryOptimization: true,
            enableFrameSkipping: true,
            memoryThreshold: 30 // MB
          }}
          style={styles.camera}
        />
      </View>

      <View style={styles.metricsContainer}>
        <ThemedText style={styles.title}>Frame Processing Metrics</ThemedText>
        
        <ScrollView style={styles.metricsScroll}>
          <View style={styles.metricRow}>
            <ThemedText style={styles.metricLabel}>Status:</ThemedText>
            <ThemedText style={[styles.metricValue, { color: isReady ? '#4CAF50' : '#FF9800' }]}>
              {isReady ? 'Ready' : 'Initializing'}
            </ThemedText>
          </View>

          {metrics && (
            <>
              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>FPS:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.fps.toFixed(1)}
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Frame Count:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.frameCount}
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Avg Processing Time:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.avgProcessingTime.toFixed(2)}ms
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Last Frame Timestamp:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.lastFrameTimestamp.toFixed(2)}ms
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Memory Usage:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.memoryStats.currentUsage.toFixed(1)}MB
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Buffer Pool Size:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.memoryStats.bufferPoolSize}
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Frames Skipped:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.framesSkipped}
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>CPU Load:</ThemedText>
                <ThemedText style={[styles.metricValue, { color: metrics.cpuLoadHigh ? '#FF5722' : '#4CAF50' }]}>
                  {metrics.cpuLoadHigh ? 'HIGH' : 'NORMAL'}
                </ThemedText>
              </View>

              <View style={styles.metricRow}>
                <ThemedText style={styles.metricLabel}>Memory Dropped:</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {metrics.memoryStats.framesDropped}
                </ThemedText>
              </View>
            </>
          )}

          <View style={styles.instructions}>
            <ThemedText style={styles.instructionTitle}>Instructions:</ThemedText>
            <ThemedText style={styles.instructionText}>
              • Toggle "Frame Proc" button to enable/disable frame processing{'\n'}
              • Green dot = Camera ready, Blue dot = Frame processor active{'\n'}
              • Memory optimization and frame skipping are enabled{'\n'}
              • CPU Load: HIGH = automatic frame skipping active{'\n'}
              • Buffer Pool: Reuses memory to reduce garbage collection{'\n'}
              • Frames Dropped: Emergency memory pressure protection{'\n'}
              • Check console for detailed frame logs and error recovery{'\n'}
              • Metrics update every second - test for 10+ minutes
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 2,
    minHeight: 300,
  },
  camera: {
    flex: 1,
  },
  metricsContainer: {
    flex: 1,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  metricsScroll: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  instructions: {
    marginTop: 20,
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
});