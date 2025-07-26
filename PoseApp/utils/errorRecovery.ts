import { useSharedValue } from 'react-native-reanimated';
import { useCallback, useRef } from 'react';

/**
 * Error types for frame processing
 */
export enum FrameProcessingError {
  MEMORY_PRESSURE = 'MEMORY_PRESSURE',
  HIGH_CPU_LOAD = 'HIGH_CPU_LOAD',
  BUFFER_OVERFLOW = 'BUFFER_OVERFLOW',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  CAMERA_DISCONNECTED = 'CAMERA_DISCONNECTED'
}

/**
 * Recovery strategy for different error types
 */
export enum RecoveryStrategy {
  REDUCE_FPS = 'REDUCE_FPS',
  SKIP_FRAMES = 'SKIP_FRAMES',
  FORCE_CLEANUP = 'FORCE_CLEANUP',
  RESTART_PROCESSOR = 'RESTART_PROCESSOR',
  EMERGENCY_STOP = 'EMERGENCY_STOP'
}

/**
 * Error recovery configuration
 */
interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  memoryThreshold: number;
  cpuThreshold: number;
  enableAutoRecovery: boolean;
}

/**
 * Error event details
 */
interface ErrorEvent {
  type: FrameProcessingError;
  timestamp: number;
  details: string;
  recoveryStrategy: RecoveryStrategy;
  retryCount: number;
}

/**
 * Frame processor error recovery manager
 */
class FrameProcessorErrorRecovery {
  private config: ErrorRecoveryConfig;
  private errorHistory: ErrorEvent[] = [];
  private retryCounters: Map<FrameProcessingError, number> = new Map();
  private lastRecoveryTime: number = 0;
  private recoveryInProgress: boolean = false;

  constructor(config: ErrorRecoveryConfig) {
    this.config = config;
  }

  /**
   * Handle a frame processing error
   */
  handleError(
    errorType: FrameProcessingError, 
    details: string,
    context: {
      memoryUsage?: number;
      cpuLoad?: number;
      frameRate?: number;
      bufferPoolSize?: number;
    } = {}
  ): RecoveryStrategy | null {
    const now = Date.now();
    const retryCount = this.retryCounters.get(errorType) || 0;

    // Check if we've exceeded max retries
    if (retryCount >= this.config.maxRetries) {
      console.error(`🚨 [ErrorRecovery] Max retries exceeded for ${errorType}. Emergency stop required.`);
      return RecoveryStrategy.EMERGENCY_STOP;
    }

    // Determine recovery strategy based on error type and context
    const strategy = this.determineRecoveryStrategy(errorType, context);
    
    // Record the error event
    const errorEvent: ErrorEvent = {
      type: errorType,
      timestamp: now,
      details,
      recoveryStrategy: strategy,
      retryCount
    };

    this.errorHistory.push(errorEvent);
    
    // Keep only last 50 error events
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }

    // Update retry counter
    this.retryCounters.set(errorType, retryCount + 1);

    console.warn(`⚠️ [ErrorRecovery] ${errorType}: ${details} | Strategy: ${strategy} | Retry: ${retryCount + 1}/${this.config.maxRetries}`);

    return strategy;
  }

  /**
   * Determine the best recovery strategy for an error
   */
  private determineRecoveryStrategy(
    errorType: FrameProcessingError,
    context: {
      memoryUsage?: number;
      cpuLoad?: number;
      frameRate?: number;
      bufferPoolSize?: number;
    }
  ): RecoveryStrategy {
    switch (errorType) {
      case FrameProcessingError.MEMORY_PRESSURE:
        if (context.memoryUsage && context.memoryUsage > this.config.memoryThreshold * 1.5) {
          return RecoveryStrategy.EMERGENCY_STOP;
        }
        return context.bufferPoolSize && context.bufferPoolSize > 10 
          ? RecoveryStrategy.FORCE_CLEANUP 
          : RecoveryStrategy.SKIP_FRAMES;

      case FrameProcessingError.HIGH_CPU_LOAD:
        return context.frameRate && context.frameRate > 20 
          ? RecoveryStrategy.REDUCE_FPS 
          : RecoveryStrategy.SKIP_FRAMES;

      case FrameProcessingError.BUFFER_OVERFLOW:
        return RecoveryStrategy.FORCE_CLEANUP;

      case FrameProcessingError.PROCESSING_TIMEOUT:
        return RecoveryStrategy.SKIP_FRAMES;

      case FrameProcessingError.CAMERA_DISCONNECTED:
        return RecoveryStrategy.RESTART_PROCESSOR;

      default:
        return RecoveryStrategy.SKIP_FRAMES;
    }
  }

  /**
   * Execute a recovery strategy
   */
  async executeRecovery(
    strategy: RecoveryStrategy,
    context: {
      onReduceFps?: (newFps: number) => void;
      onForceCleanup?: () => void;
      onRestartProcessor?: () => void;
      onEmergencyStop?: () => void;
      currentFps?: number;
    }
  ): Promise<boolean> {
    if (this.recoveryInProgress) {
      console.log(`⏳ [ErrorRecovery] Recovery already in progress, skipping...`);
      return false;
    }

    this.recoveryInProgress = true;
    this.lastRecoveryTime = Date.now();

    try {
      console.log(`🔧 [ErrorRecovery] Executing recovery strategy: ${strategy}`);

      switch (strategy) {
        case RecoveryStrategy.REDUCE_FPS:
          const currentFps = context.currentFps || 30;
          const newFps = Math.max(10, Math.floor(currentFps * 0.7)); // Reduce by 30%
          console.log(`📉 [ErrorRecovery] Reducing FPS from ${currentFps} to ${newFps}`);
          context.onReduceFps?.(newFps);
          break;

        case RecoveryStrategy.SKIP_FRAMES:
          console.log(`⏭️ [ErrorRecovery] Enabling aggressive frame skipping`);
          // This would be handled by the CPU load monitor
          break;

        case RecoveryStrategy.FORCE_CLEANUP:
          console.log(`🧹 [ErrorRecovery] Forcing memory cleanup`);
          context.onForceCleanup?.();
          break;

        case RecoveryStrategy.RESTART_PROCESSOR:
          console.log(`🔄 [ErrorRecovery] Restarting frame processor`);
          context.onRestartProcessor?.();
          break;

        case RecoveryStrategy.EMERGENCY_STOP:
          console.error(`🛑 [ErrorRecovery] Emergency stop - halting frame processing`);
          context.onEmergencyStop?.();
          break;
      }

      // Wait for recovery delay
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      
      console.log(`✅ [ErrorRecovery] Recovery strategy ${strategy} completed`);
      return true;

    } catch (error) {
      console.error(`❌ [ErrorRecovery] Recovery failed: ${error}`);
      return false;
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * Check if system is in a recoverable state
   */
  isRecoverable(errorType: FrameProcessingError): boolean {
    const retryCount = this.retryCounters.get(errorType) || 0;
    return retryCount < this.config.maxRetries && !this.recoveryInProgress;
  }

  /**
   * Reset retry counters (call after successful operation)
   */
  resetRetryCounters(): void {
    this.retryCounters.clear();
    console.log(`🔄 [ErrorRecovery] Retry counters reset - system stable`);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    lastRecoveryTime: number;
    recoveryInProgress: boolean;
  } {
    const errorsByType: Record<string, number> = {};
    
    this.errorHistory.forEach(event => {
      errorsByType[event.type] = (errorsByType[event.type] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      lastRecoveryTime: this.lastRecoveryTime,
      recoveryInProgress: this.recoveryInProgress
    };
  }

  /**
   * Get recent error history
   */
  getRecentErrors(limit: number = 10): ErrorEvent[] {
    return this.errorHistory.slice(-limit);
  }
}

/**
 * Hook for frame processor error recovery
 */
export const useFrameProcessorErrorRecovery = (config?: Partial<ErrorRecoveryConfig>) => {
  const defaultConfig: ErrorRecoveryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    memoryThreshold: 50, // MB
    cpuThreshold: 80, // percentage
    enableAutoRecovery: true,
    ...config
  };

  const errorRecovery = useRef(new FrameProcessorErrorRecovery(defaultConfig)).current;
  const isRecovering = useSharedValue(false);
  const errorCount = useSharedValue(0);

  const handleError = useCallback((
    errorType: FrameProcessingError,
    details: string,
    context: any = {}
  ) => {
    const strategy = errorRecovery.handleError(errorType, details, context);
    if (strategy) {
      errorCount.value += 1;
      return strategy;
    }
    return null;
  }, [errorRecovery, errorCount]);

  const executeRecovery = useCallback(async (
    strategy: RecoveryStrategy,
    context: any = {}
  ) => {
    isRecovering.value = true;
    try {
      const success = await errorRecovery.executeRecovery(strategy, context);
      if (success) {
        // Reset counters after successful recovery
        setTimeout(() => {
          errorRecovery.resetRetryCounters();
          errorCount.value = 0;
        }, 5000); // Reset after 5 seconds of stability
      }
      return success;
    } finally {
      isRecovering.value = false;
    }
  }, [errorRecovery, isRecovering, errorCount]);

  const getErrorStats = useCallback(() => {
    return errorRecovery.getErrorStats();
  }, [errorRecovery]);

  const isRecoverable = useCallback((errorType: FrameProcessingError) => {
    return errorRecovery.isRecoverable(errorType);
  }, [errorRecovery]);

  return {
    handleError,
    executeRecovery,
    getErrorStats,
    isRecoverable,
    sharedValues: {
      isRecovering,
      errorCount
    }
  };
};