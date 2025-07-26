import { useFrameProcessor, runAtTargetFps, runAsync } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';
import { useCallback, useRef } from 'react';
import { useFrameMemoryManager, CPULoadMonitor, MemoryStats } from './memoryManager';
import { useFrameProcessorErrorRecovery, FrameProcessingError, RecoveryStrategy } from './errorRecovery';

/**
 * Frame processing performance metrics
 */
export interface FrameProcessingMetrics {
  frameCount: number;
  avgProcessingTime: number;
  lastFrameTimestamp: number;
  fps: number;
  memoryStats: MemoryStats;
  framesSkipped: number;
  cpuLoadHigh: boolean;
}

/**
 * Frame data extracted for processing
 */
export interface ProcessedFrameData {
  width: number;
  height: number;
  pixelFormat: string;
  timestamp: number;
  processingTime: number;
  frameIndex: number;
}

/**
 * Configuration for frame processor
 */
export interface FrameProcessorConfig {
  targetFps?: number;
  enableMetrics?: boolean;
  enableAsyncProcessing?: boolean;
  logFrameInfo?: boolean;
  enableMemoryOptimization?: boolean;
  enableFrameSkipping?: boolean;
  memoryThreshold?: number; // MB
}

/**
 * Advanced frame processor hook with performance monitoring
 * and configurable processing options
 */
export const useAdvancedFrameProcessor = (
  config: FrameProcessorConfig = {}
) => {
  const {
    targetFps = 30,
    enableMetrics = true,
    enableAsyncProcessing = false,
    logFrameInfo = false,
    enableMemoryOptimization = true,
    enableFrameSkipping = true,
    memoryThreshold = 50
  } = config;

  // Shared values for cross-thread communication
  const frameCount = useSharedValue(0);
  const lastProcessingTime = useSharedValue(0);
  const avgProcessingTime = useSharedValue(0);
  const lastFpsCheck = useSharedValue(Date.now());
  const currentFps = useSharedValue(0);
  const framesSkipped = useSharedValue(0);
  const cpuLoadHigh = useSharedValue(false);

  // Simple worklet-compatible values for memory and CPU tracking
  const memoryUsage = useSharedValue(0);
  const bufferPoolSize = useSharedValue(0);
  const processingTimes = useSharedValue<number[]>([]);
  const memoryThresholdValue = useSharedValue(memoryThreshold);
  const highCPUThreshold = useSharedValue(16.67); // ~60 FPS in ms

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    
    const startTime = Date.now();
    frameCount.value += 1;

    // Simple memory pressure check using shared values
    if (enableMemoryOptimization && memoryUsage.value > memoryThresholdValue.value) {
      console.warn(`⚠️ [FrameProcessor] Memory pressure detected: ${memoryUsage.value.toFixed(1)}MB`);
      // Skip frame under memory pressure
      framesSkipped.value += 1;
      return;
    }

    // Simple CPU load check using processing times
    if (enableFrameSkipping) {
      const times = processingTimes.value;
      if (times.length > 5) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        if (avgTime > highCPUThreshold.value) {
          // Skip 30% of frames under high CPU load
          if (Math.random() < 0.3) {
            framesSkipped.value += 1;
            cpuLoadHigh.value = true;
            console.log(`⏭️ [FrameProcessor] Frame #${frameCount.value} skipped due to high CPU load (${avgTime.toFixed(2)}ms avg)`);
            return;
          }
        } else {
          cpuLoadHigh.value = false;
        }
      }
    }

    // Extract basic frame information
    const frameData: ProcessedFrameData = {
      width: frame.width,
      height: frame.height,
      pixelFormat: frame.pixelFormat,
      timestamp: frame.timestamp,
      processingTime: 0,
      frameIndex: frameCount.value
    };

    // Always log detailed frame data when frame processor is running
    if (frameData.frameIndex % 30 === 0) { // Log every 30th frame to avoid spam
      console.log(`📸 [FrameProcessor DATA] Frame #${frameData.frameIndex}: ${frameData.width}x${frameData.height} | Format: ${frameData.pixelFormat} | Timestamp: ${frameData.timestamp}ms`);
    }

    // Run at target FPS to control processing load
    runAtTargetFps(targetFps, () => {
      'worklet'
      
      if (enableAsyncProcessing) {
        // Process heavy computations asynchronously
        runAsync(frame, () => {
          'worklet'
          // This is where pose detection would run
          // const poseData = processPoseDetection(frame);
          
          if (logFrameInfo) {
            console.log(`[FrameProcessor] Async processing for frame ${frameData.frameIndex}`);
          }
        });
      }

      // Lightweight synchronous processing
      if (enableMetrics) {
        const processingTime = Date.now() - startTime;
        lastProcessingTime.value = processingTime;
        
        // Update processing times array for CPU monitoring
        const times = processingTimes.value;
        times.push(processingTime);
        if (times.length > 30) { // Keep last 30 samples
          times.shift();
        }
        processingTimes.value = times;
        
        // Calculate rolling average
        avgProcessingTime.value = (avgProcessingTime.value * 0.9) + (processingTime * 0.1);
        
        // Simple memory usage estimation (MB)
        const estimatedMemory = (frame.width * frame.height * 4) / (1024 * 1024);
        memoryUsage.value = (memoryUsage.value * 0.9) + (estimatedMemory * 0.1);
        
        // Calculate FPS every second
        const now = Date.now();
        if (now - lastFpsCheck.value >= 1000) {
          currentFps.value = frameCount.value / ((now - lastFpsCheck.value) / 1000);
          lastFpsCheck.value = now;
          frameCount.value = 0;
          
          // Simplified logging with worklet-compatible values
          const cpuInfo = `| CPU Load: ${cpuLoadHigh.value ? 'HIGH' : 'NORMAL'} | Skipped: ${framesSkipped.value}`;
          const memInfo = `| Memory: ${memoryUsage.value.toFixed(1)}MB`;
          
          console.log(`🎥 [FrameProcessor METRICS] FPS: ${currentFps.value.toFixed(1)} | Avg Processing: ${avgProcessingTime.value.toFixed(2)}ms ${memInfo} ${cpuInfo}`);
        }
      }
    });

    frameData.processingTime = Date.now() - startTime;
    return frameData;
  }, [targetFps, enableMetrics, enableAsyncProcessing, logFrameInfo, enableMemoryOptimization, enableFrameSkipping]);

  // Getter functions to access metrics from React
  const getMetrics = useCallback((): FrameProcessingMetrics => ({
    frameCount: frameCount.value,
    avgProcessingTime: avgProcessingTime.value,
    lastFrameTimestamp: lastProcessingTime.value,
    fps: currentFps.value,
    memoryStats: {
      currentUsage: memoryUsage.value,
      peakUsage: memoryUsage.value, // Simplified
      gcCount: 0,
      bufferPoolSize: bufferPoolSize.value,
      framesDropped: 0, // Simplified
      lastCleanup: Date.now()
    },
    framesSkipped: framesSkipped.value,
    cpuLoadHigh: cpuLoadHigh.value
  }), [frameCount, avgProcessingTime, lastProcessingTime, currentFps, framesSkipped, cpuLoadHigh, memoryUsage, bufferPoolSize]);

  return {
    frameProcessor,
    getMetrics,
    // Shared values for direct access in other worklets/UI
    sharedValues: {
      frameCount,
      avgProcessingTime,
      currentFps,
      framesSkipped,
      cpuLoadHigh,
      memoryUsage,
      bufferPoolSize
    }
  };
};

/**
 * Basic frame processor for simple use cases
 */
export const useBasicFrameProcessor = (logFrames: boolean = false) => {
  return useFrameProcessor((frame) => {
    'worklet'
    
    if (logFrames) {
      console.log(`[BasicFrameProcessor] ${frame.width}x${frame.height} @ ${frame.timestamp}`);
    }

    // Basic frame data extraction
    const frameInfo = {
      width: frame.width,
      height: frame.height,
      pixelFormat: frame.pixelFormat,
      timestamp: frame.timestamp
    };

    return frameInfo;
  }, [logFrames]);
};

/**
 * Frame processor specifically designed for pose detection preparation
 */
export const usePoseDetectionFrameProcessor = () => {
  const poseDataBuffer = useSharedValue<any[]>([]); // Buffer for pose detection results
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    
    // Optimize for pose detection: run at lower FPS to reduce CPU load
    runAtTargetFps(25, () => {
      'worklet'
      
      // Validate frame for pose detection
      if (frame.width < 480 || frame.height < 480) {
        console.log('[PoseDetection] Frame too small for reliable pose detection');
        return;
      }

      // For now, just prepare the frame data structure
      // This will be replaced with actual TensorFlow Lite inference
      const poseFrame = {
        width: frame.width,
        height: frame.height,
        pixelFormat: frame.pixelFormat,
        timestamp: frame.timestamp,
        // Placeholder for pose detection results
        keypoints: [],
        confidence: 0,
        processingTime: 0
      };

      // Store in buffer (keep last 5 results for smoothing)
      const buffer = poseDataBuffer.value;
      buffer.push(poseFrame);
      if (buffer.length > 5) {
        buffer.shift();
      }
      poseDataBuffer.value = buffer;

      console.log(`[PoseDetection] Frame prepared for processing: ${frame.width}x${frame.height}`);
    });

  }, []);

  return { 
    frameProcessor, 
    poseDataBuffer 
  };
};