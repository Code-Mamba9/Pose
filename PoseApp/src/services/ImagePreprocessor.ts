import type { Frame } from 'react-native-vision-camera';

// Note: This preprocessor requires vision-camera-resize-plugin to be used 
// through the useResizePlugin hook in the component that uses it

export interface PreprocessingConfig {
  inputSize: number;
  maintainAspectRatio: boolean;
  outputFormat: 'uint8' | 'float32';
  normalizeValues: boolean;
}

export interface ResizeOptions {
  scale: { width: number; height: number };
  pixelFormat: 'rgb' | 'rgba' | 'argb';
  dataType: 'uint8' | 'float32';
  crop?: { x: number; y: number; width: number; height: number };
}

export type ResizeFunction = (frame: Frame, options: ResizeOptions) => ArrayBuffer;

export interface PreprocessingResult {
  data: Uint8Array | Float32Array;
  width: number;
  height: number;
  channels: number;
  processingTime: number;
}

/**
 * High-performance image preprocessor for MoveNet model input
 * Uses hardware-accelerated YUV→RGB conversion and resizing
 */
export class ImagePreprocessor {
  private config: PreprocessingConfig;
  private resizeFunc: ResizeFunction;

  constructor(config: PreprocessingConfig, resizeFunc: ResizeFunction) {
    this.config = config;
    this.resizeFunc = resizeFunc;
  }

  /**
   * Preprocess camera frame for MoveNet model inference
   * Optimized for real-time performance with worklet compatibility
   */
  preprocessFrame(frame: Frame): PreprocessingResult {
    'worklet';
    
    const startTime = Date.now();

    try {
      console.log('Starting preprocessing for frame:', frame.width, 'x', frame.height);
      
      // Calculate target dimensions with aspect ratio handling
      const { targetWidth, targetHeight, cropConfig } = this.calculateDimensions(
        frame.width,
        frame.height
      );
      
      console.log('Target dimensions:', targetWidth, 'x', targetHeight);
      console.log('Crop config:', cropConfig);

      // Hardware-accelerated resize and format conversion
      console.log('Calling resize function...');
      const resizedBuffer = this.resizeFunc(frame, {
        scale: {
          width: targetWidth,
          height: targetHeight,
        },
        pixelFormat: 'rgb',
        dataType: this.config.outputFormat,
        crop: cropConfig,
      });
      
      console.log('Resize completed, result length:', resizedBuffer?.byteLength);
      
      if (!resizedBuffer) {
        throw new Error('Resize function returned null/undefined');
      }

      // Create properly typed array based on output format
      let processedData: Uint8Array | Float32Array;
      
      if (this.config.outputFormat === 'uint8') {
        processedData = new Uint8Array(resizedBuffer);
        
        // Optional normalization for uint8 (typically not needed for MoveNet)
        if (this.config.normalizeValues) {
          processedData = this.normalizeUint8ToFloat32(processedData);
        }
      } else {
        // Already float32 from resize plugin
        processedData = new Float32Array(resizedBuffer);
      }

      const processingTime = Date.now() - startTime;

      return {
        data: processedData,
        width: targetWidth,
        height: targetHeight,
        channels: 3, // RGB
        processingTime,
      };

    } catch (error) {
      console.error('Frame preprocessing failed:', error);
      throw new Error(`Preprocessing failed: ${error}`);
    }
  }

  /**
   * Calculate optimal dimensions and crop configuration
   * Maintains aspect ratio with center cropping
   */
  private calculateDimensions(
    frameWidth: number,
    frameHeight: number
  ): {
    targetWidth: number;
    targetHeight: number;
    cropConfig?: { x: number; y: number; width: number; height: number };
  } {
    'worklet';

    const targetSize = this.config.inputSize;

    if (!this.config.maintainAspectRatio) {
      // Simple resize without aspect ratio preservation
      return {
        targetWidth: targetSize,
        targetHeight: targetSize,
      };
    }

    // Calculate aspect ratios
    const frameAspectRatio = frameWidth / frameHeight;
    const targetAspectRatio = 1.0; // Square aspect ratio for MoveNet

    let cropConfig;

    if (frameAspectRatio > targetAspectRatio) {
      // Frame is wider - crop horizontally
      const cropWidth = frameHeight * targetAspectRatio;
      const cropX = (frameWidth - cropWidth) / 2;
      
      cropConfig = {
        x: Math.max(0, Math.floor(cropX)),
        y: 0,
        width: Math.floor(cropWidth),
        height: frameHeight,
      };
    } else if (frameAspectRatio < targetAspectRatio) {
      // Frame is taller - crop vertically
      const cropHeight = frameWidth / targetAspectRatio;
      const cropY = (frameHeight - cropHeight) / 2;
      
      cropConfig = {
        x: 0,
        y: Math.max(0, Math.floor(cropY)),
        width: frameWidth,
        height: Math.floor(cropHeight),
      };
    }
    // If aspect ratios match, no cropping needed

    return {
      targetWidth: targetSize,
      targetHeight: targetSize,
      cropConfig,
    };
  }

  /**
   * Convert uint8 values (0-255) to normalized float32 (0.0-1.0)
   */
  private normalizeUint8ToFloat32(uint8Data: Uint8Array): Float32Array {
    'worklet';
    
    const float32Data = new Float32Array(uint8Data.length);
    
    for (let i = 0; i < uint8Data.length; i++) {
      float32Data[i] = uint8Data[i] / 255.0;
    }
    
    return float32Data;
  }

  /**
   * Update preprocessing configuration
   */
  updateConfig(newConfig: Partial<PreprocessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PreprocessingConfig {
    return { ...this.config };
  }
}

/**
 * Default preprocessing configuration for MoveNet Lightning
 */
export const MOVENET_PREPROCESSING_CONFIG: PreprocessingConfig = {
  inputSize: 192,
  maintainAspectRatio: true,
  outputFormat: 'uint8', // MoveNet expects uint8 input
  normalizeValues: false, // Keep raw uint8 values (0-255)
};

/**
 * Create a preprocessor instance with MoveNet defaults
 * @param resizeFunc - The resize function from useResizePlugin() hook
 */
export function createMoveNetPreprocessor(resizeFunc: ResizeFunction): ImagePreprocessor {
  return new ImagePreprocessor(MOVENET_PREPROCESSING_CONFIG, resizeFunc);
}