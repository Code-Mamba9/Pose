import { useSharedValue } from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  currentUsage: number;
  peakUsage: number;
  gcCount: number;
  bufferPoolSize: number;
  framesDropped: number;
  lastCleanup: number;
}

/**
 * Frame buffer pool configuration
 */
export interface BufferPoolConfig {
  maxPoolSize: number;
  maxBufferAge: number; // milliseconds
  cleanupInterval: number; // milliseconds
  memoryThreshold: number; // MB
  enableAutoCleanup: boolean;
}

/**
 * Frame buffer for reuse
 */
interface FrameBuffer {
  id: string;
  data: any;
  timestamp: number;
  inUse: boolean;
  size: number;
}

/**
 * Memory manager class for frame buffer pooling and optimization
 */
class FrameMemoryManager {
  private bufferPool: FrameBuffer[] = [];
  private config: BufferPoolConfig;
  private stats: MemoryStats;
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private gcMonitorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: BufferPoolConfig) {
    this.config = config;
    this.stats = {
      currentUsage: 0,
      peakUsage: 0,
      gcCount: 0,
      bufferPoolSize: 0,
      framesDropped: 0,
      lastCleanup: Date.now()
    };

    if (config.enableAutoCleanup) {
      this.startAutoCleanup();
    }
    this.startGCMonitoring();
  }

  /**
   * Get or create a frame buffer from the pool
   */
  acquireBuffer(size: number): FrameBuffer {
    'worklet'
    // Try to find an unused buffer of appropriate size
    const availableBuffer = this.bufferPool.find(
      buffer => !buffer.inUse && buffer.size >= size
    );

    if (availableBuffer) {
      availableBuffer.inUse = true;
      availableBuffer.timestamp = Date.now();
      return availableBuffer;
    }

    // Check if we can create a new buffer
    if (this.bufferPool.length >= this.config.maxPoolSize) {
      // Pool is full, try to reclaim an old buffer
      this.forceCleanup();
      
      // If still full, drop frame
      if (this.bufferPool.length >= this.config.maxPoolSize) {
        this.stats.framesDropped++;
        console.warn(`🚨 [MemoryManager] Frame dropped - pool full (${this.bufferPool.length} buffers)`);
        
        // Return a temporary buffer that won't be pooled
        return {
          id: `temp-${Date.now()}`,
          data: null,
          timestamp: Date.now(),
          inUse: true,
          size: size
        };
      }
    }

    // Create new buffer
    const newBuffer: FrameBuffer = {
      id: `buffer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data: null,
      timestamp: Date.now(),
      inUse: true,
      size: size
    };

    this.bufferPool.push(newBuffer);
    this.stats.bufferPoolSize = this.bufferPool.length;
    this.updateMemoryUsage();

    console.log(`📦 [MemoryManager] Created new buffer (${this.bufferPool.length}/${this.config.maxPoolSize})`);
    return newBuffer;
  }

  /**
   * Release a frame buffer back to the pool
   */
  releaseBuffer(buffer: FrameBuffer): void {
    'worklet'
    const poolBuffer = this.bufferPool.find(b => b.id === buffer.id);
    if (poolBuffer) {
      poolBuffer.inUse = false;
      poolBuffer.timestamp = Date.now();
      // Clear data to help with garbage collection
      poolBuffer.data = null;
    }
  }

  /**
   * Force cleanup of old or unused buffers
   */
  forceCleanup(): void {
    'worklet'
    const now = Date.now();
    const initialSize = this.bufferPool.length;

    // Remove old or unused buffers
    this.bufferPool = this.bufferPool.filter(buffer => {
      const age = now - buffer.timestamp;
      const shouldKeep = buffer.inUse || age < this.config.maxBufferAge;
      
      if (!shouldKeep) {
        // Help garbage collection
        buffer.data = null;
      }
      
      return shouldKeep;
    });

    const removedCount = initialSize - this.bufferPool.length;
    if (removedCount > 0) {
      this.stats.bufferPoolSize = this.bufferPool.length;
      this.stats.lastCleanup = now;
      console.log(`🧹 [MemoryManager] Cleaned up ${removedCount} old buffers (${this.bufferPool.length} remaining)`);
    }

    this.updateMemoryUsage();
  }

  /**
   * Check if memory pressure is high
   */
  isMemoryPressureHigh(): boolean {
    'worklet'
    return this.stats.currentUsage > this.config.memoryThreshold;
  }

  /**
   * Get current memory statistics
   */
  getStats(): MemoryStats {
    return { ...this.stats };
  }

  /**
   * Update memory usage estimates
   */
  private updateMemoryUsage(): void {
    // Estimate memory usage based on buffer pool
    const estimatedUsage = this.bufferPool.reduce((total, buffer) => {
      return total + (buffer.size || 0);
    }, 0) / (1024 * 1024); // Convert to MB

    this.stats.currentUsage = estimatedUsage;
    if (estimatedUsage > this.stats.peakUsage) {
      this.stats.peakUsage = estimatedUsage;
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.forceCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Start garbage collection monitoring
   */
  private startGCMonitoring(): void {
    let lastGCCount = 0;
    
    this.gcMonitorTimer = setInterval(() => {
      // Simplified GC monitoring (actual implementation would need native module)
      // For now, we'll estimate based on buffer churn
      const currentGCEstimate = Math.floor(this.stats.framesDropped / 100);
      if (currentGCEstimate > lastGCCount) {
        this.stats.gcCount = currentGCEstimate;
        lastGCCount = currentGCEstimate;
        console.log(`♻️ [MemoryManager] Estimated GC events: ${this.stats.gcCount}`);
      }
    }, 5000);
  }

  /**
   * Destroy the memory manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.gcMonitorTimer) {
      clearInterval(this.gcMonitorTimer);
      this.gcMonitorTimer = null;
    }

    // Clear all buffers
    this.bufferPool.forEach(buffer => {
      buffer.data = null;
    });
    this.bufferPool = [];
    
    console.log(`💀 [MemoryManager] Destroyed - cleaned up all resources`);
  }
}

/**
 * Hook for using frame memory manager
 */
export const useFrameMemoryManager = (config?: Partial<BufferPoolConfig>) => {
  const defaultConfig: BufferPoolConfig = {
    maxPoolSize: 10,
    maxBufferAge: 5000, // 5 seconds
    cleanupInterval: 3000, // 3 seconds
    memoryThreshold: 50, // 50MB
    enableAutoCleanup: true,
    ...config
  };

  const manager = new FrameMemoryManager(defaultConfig);

  // Shared values for cross-thread access
  const memoryUsage = useSharedValue(0);
  const bufferPoolSize = useSharedValue(0);
  const framesDropped = useSharedValue(0);

  // Update shared values periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const stats = manager.getStats();
      memoryUsage.value = stats.currentUsage;
      bufferPoolSize.value = stats.bufferPoolSize;
      framesDropped.value = stats.framesDropped;
    }, 1000);

    return () => {
      clearInterval(updateInterval);
      manager.destroy();
    };
  }, []);

  const acquireBuffer = useCallback((size: number) => {
    return manager.acquireBuffer(size);
  }, []);

  const releaseBuffer = useCallback((buffer: FrameBuffer) => {
    manager.releaseBuffer(buffer);
  }, []);

  const forceCleanup = useCallback(() => {
    manager.forceCleanup();
  }, []);

  const getStats = useCallback(() => {
    return manager.getStats();
  }, []);

  const isMemoryPressureHigh = useCallback(() => {
    return manager.isMemoryPressureHigh();
  }, []);

  return {
    acquireBuffer,
    releaseBuffer,
    forceCleanup,
    getStats,
    isMemoryPressureHigh,
    sharedValues: {
      memoryUsage,
      bufferPoolSize,
      framesDropped
    }
  };
};

/**
 * CPU load monitor for frame skipping decisions
 */
export class CPULoadMonitor {
  private processingTimes: number[] = [];
  private readonly maxSamples = 30; // Last 30 frame processing times
  private readonly highLoadThreshold = 16.67; // ~60 FPS threshold in ms

  addProcessingTime(timeMs: number): void {
    'worklet'
    this.processingTimes.push(timeMs);
    if (this.processingTimes.length > this.maxSamples) {
      this.processingTimes.shift();
    }
  }

  isHighCPULoad(): boolean {
    'worklet'
    if (this.processingTimes.length < 5) return false;

    const avgProcessingTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
    return avgProcessingTime > this.highLoadThreshold;
  }

  getAverageProcessingTime(): number {
    'worklet'
    if (this.processingTimes.length === 0) return 0;
    return this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  shouldSkipFrame(): boolean {
    'worklet'
    // Skip frame if CPU load is high and we have enough samples
    return this.isHighCPULoad() && Math.random() < 0.3; // Skip 30% of frames under high load
  }

  reset(): void {
    this.processingTimes = [];
  }
}