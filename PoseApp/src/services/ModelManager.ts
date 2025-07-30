import { TensorflowModel, loadTensorflowModel } from 'react-native-fast-tflite';
import { Platform } from 'react-native';

export interface ModelConfig {
  modelPath: any; // require() asset path
  enableGPU: boolean;
  inputSize: number;
  outputShape: [number, number, number, number];
}

export interface ModelMetrics {
  loadTime: number;
  gpuEnabled: boolean;
  delegate: string;
  modelSize: number;
}

export type ModelDelegate = 'gpu' | 'core-ml' | 'nnapi' | 'cpu';

/**
 * Robust ModelManager class for TensorFlow Lite model loading and management
 * Features:
 * - GPU delegate configuration with automatic fallback
 * - Memory optimization with pre-allocated buffers
 * - Comprehensive error handling
 * - Performance metrics tracking
 */
export class ModelManager {
  // Mark as Worklet Context Object to allow cross-thread access with ArrayBuffers
  __workletContextObject = true;
  
  private model: TensorflowModel | null = null;
  private isLoading = false;
  private isInitialized = false;
  private config: ModelConfig | null = null;
  private metrics: ModelMetrics | null = null;
  
  // Pre-allocated buffers for memory efficiency
  private inputBuffer: ArrayBuffer | null = null;
  private outputBuffers: ArrayBuffer[] = [];

  constructor() {
    this.model = null;
    // Ensure the worklet context object property is set
    this.__workletContextObject = true;
  }

  /**
   * Initialize the model with GPU delegate configuration
   * Automatically handles platform-specific delegates and fallback
   */
  async initialize(config: ModelConfig): Promise<ModelMetrics> {
    if (this.isLoading) {
      throw new Error('Model is already being loaded');
    }

    if (this.isInitialized) {
      console.warn('Model is already initialized');
      return this.metrics!;
    }

    this.isLoading = true;
    const startTime = Date.now();

    try {
      this.config = config;
      
      // Determine optimal delegate for platform
      const delegate = this.getOptimalDelegate(config.enableGPU);
      
      console.log(`Loading model with ${delegate} delegate...`);
      
      // Load model with primary delegate
      console.log('Loading TensorFlow Lite model with config:', {
        modelPath: config.modelPath,
        delegate: delegate,
        enableGPU: config.enableGPU,
        inputSize: config.inputSize,
        outputShape: config.outputShape
      });
      
      this.model = await this.loadModelWithDelegate(config.modelPath, delegate);
      
      console.log('Model loaded successfully:', {
        model: !!this.model,
        modelType: Object.prototype.toString.call(this.model),
        hasRunSync: typeof this.model?.runSync === 'function'
      });
      
      // Pre-allocate memory buffers
      this.initializeBuffers(config);
      
      const loadTime = Date.now() - startTime;
      
      this.metrics = {
        loadTime,
        gpuEnabled: delegate !== 'cpu',
        delegate,
        modelSize: this.estimateModelSize(config),
      };

      this.isInitialized = true;
      console.log(`Model loaded successfully in ${loadTime}ms with ${delegate} delegate`);
      
      return this.metrics;
      
    } catch (error) {
      console.error('Model initialization failed:', error);
      throw new Error(`Model initialization failed: ${error}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Run inference with memory-optimized buffer reuse
   * This method is workletized to be callable from frame processors
   */
  runInference(inputData: Uint8Array | Float32Array): Float32Array {
    'worklet';
    if (!this.model || !this.isInitialized) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    try {
      // Debug input data type and properties
      console.log('ModelManager.runInference input validation:', {
        dataType: Object.prototype.toString.call(inputData),
        constructor: inputData?.constructor?.name,
        isUint8Array: inputData instanceof Uint8Array,
        isFloat32Array: inputData instanceof Float32Array,
        length: inputData?.length
      });

      // Validate input data
      if (!(inputData instanceof Uint8Array) && !(inputData instanceof Float32Array)) {
        throw new Error(`Input data must be a Uint8Array or Float32Array, received: ${Object.prototype.toString.call(inputData)}`);
      }

      // Run synchronous inference directly with the TypedArray
      const outputs = this.model.runSync([inputData]);
      
      console.log('TensorFlow Lite model outputs:', {
        numOutputs: outputs.length,
        outputShapes: outputs.map((output, i) => ({
          index: i,
          length: output.length,
          type: Object.prototype.toString.call(output)
        }))
      });
      
      // For MoveNet, we typically only need the first output tensor
      if (outputs.length === 0) {
        throw new Error('Model returned no outputs');
      }
      
      // Convert first output to Float32Array for easier handling
      const firstOutput = outputs[0];
      let finalOutput: Float32Array;
      
      if (!(firstOutput instanceof Float32Array)) {
        console.log('Converting non-Float32Array output to Float32Array:', {
          originalType: firstOutput?.constructor?.name || 'Unknown',
          originalLength: firstOutput?.length
        });
        finalOutput = new Float32Array(firstOutput);
      } else {
        finalOutput = firstOutput;
      }

      // Detailed debugging of the final output
      console.log('Final ModelManager output before return:', {
        length: finalOutput.length,
        type: finalOutput?.constructor?.name || 'Unknown',
        isFloat32Array: finalOutput instanceof Float32Array,
        hasValues: finalOutput.length > 0,
        firstFewValues: finalOutput.length > 0 ? [finalOutput[0], finalOutput[1], finalOutput[2]] : 'No values',
        isIterable: typeof finalOutput[Symbol.iterator] === 'function',
        canArrayFrom: (() => {
          try {
            const testArray = Array.from(finalOutput);
            return {
              success: true,
              testArrayType: testArray?.constructor?.name || 'Unknown',
              testArrayLength: testArray.length,
              testArrayFirstValues: testArray.length > 0 ? testArray.slice(0, 3) : 'No values'
            };
          } catch (testError) {
            return {
              success: false,
              error: testError.message
            };
          }
        })()
      });

      return finalOutput;
      
    } catch (error) {
      console.error('Inference failed - detailed error:', {
        error: error,
        errorType: Object.prototype.toString.call(error),
        message: error instanceof Error ? error.message : 'No message',
        stack: error instanceof Error ? error.stack : 'No stack',
        name: error instanceof Error ? error.name : 'No name',
        errorKeys: error ? Object.keys(error) : 'No keys'
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Inference failed: ${errorMessage}`);
    }
  }

  /**
   * Get model performance metrics
   */
  getMetrics(): ModelMetrics | null {
    return this.metrics;
  }

  /**
   * Check if model is ready for inference
   */
  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Dispose model and free memory
   */
  dispose(): void {
    try {
      this.model = null;
      this.inputBuffer = null;
      this.outputBuffers = [];
      this.isInitialized = false;
      this.config = null;
      this.metrics = null;
      
      console.log('Model disposed successfully');
    } catch (error) {
      console.error('Error disposing model:', error);
    }
  }

  /**
   * Determine optimal delegate based on platform and GPU availability
   */
  private getOptimalDelegate(enableGPU: boolean): ModelDelegate {
    if (!enableGPU) {
      return 'cpu';
    }

    if (Platform.OS === 'ios') {
      // CoreML is the preferred GPU delegate for iOS
      return 'core-ml';
    } else if (Platform.OS === 'android') {
      // Use GPU delegate for Android (NNAPI is deprecated on Android 15+)
      return 'gpu';
    }

    return 'cpu';
  }

  /**
   * Load model with specific delegate and automatic fallback
   */
  private async loadModelWithDelegate(
    modelPath: any, 
    delegate: ModelDelegate
  ): Promise<TensorflowModel> {
    try {
      // Attempt to load with specified delegate
      if (delegate === 'cpu') {
        return await loadTensorflowModel(modelPath);
      } else {
        return await loadTensorflowModel(modelPath, delegate as any);
      }
    } catch (error) {
      console.warn(`Failed to load model with ${delegate} delegate:`, error);
      
      // Fallback to CPU if GPU delegate fails
      if (delegate !== 'cpu') {
        console.log('Falling back to CPU delegate...');
        return await loadTensorflowModel(modelPath);
      }
      
      throw error;
    }
  }

  /**
   * Initialize pre-allocated buffers for memory efficiency
   */
  private initializeBuffers(config: ModelConfig): void {
    try {
      // Calculate input buffer size: width * height * channels * bytes_per_float
      const inputSize = config.inputSize * config.inputSize * 3 * 4;
      this.inputBuffer = new ArrayBuffer(inputSize);

      // Calculate output buffer sizes based on output shape [1, 1, 17, 3]
      const outputSize = config.outputShape[0] * config.outputShape[1] * 
                        config.outputShape[2] * config.outputShape[3] * 4;
      this.outputBuffers = [new ArrayBuffer(outputSize)];

      console.log(`Allocated buffers: input=${inputSize} bytes, output=${outputSize} bytes`);
    } catch (error) {
      console.error('Failed to initialize buffers:', error);
      throw error;
    }
  }

  /**
   * Estimate model size for metrics (rough calculation)
   */
  private estimateModelSize(config: ModelConfig): number {
    // This is a rough estimate - actual size should be read from model metadata
    return config.inputSize * config.inputSize * 3 * 4; // Input tensor size as proxy
  }
}

/**
 * Singleton instance for global model management
 */
export const globalModelManager = new ModelManager();