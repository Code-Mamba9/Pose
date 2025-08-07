import type { Frame } from 'react-native-vision-camera';

export interface PreprocessingConfig {
  inputSize: number;
  maintainAspectRatio: boolean;
  outputFormat: 'uint8' | 'float32';
  normalizeValues: boolean;
}

export interface PreprocessingResult {
  data: Uint8Array | Float32Array;
  width: number;
  height: number;
  channels: number;
  processingTime: number;
}

export interface ResizeOptions {
  scale: { width: number; height: number };
  pixelFormat: 'rgb' | 'rgba' | 'argb';
  dataType: 'uint8' | 'float32';
  crop?: { x: number; y: number; width: number; height: number };
}

export type ResizeFunction = (frame: Frame, options: ResizeOptions) => ArrayBuffer;

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
 * Calculate optimal dimensions and crop configuration
 * Maintains aspect ratio with center cropping
 */
function calculateDimensions(
  frameWidth: number,
  frameHeight: number,
  config: PreprocessingConfig
): {
  targetWidth: number;
  targetHeight: number;
  cropConfig?: { x: number; y: number; width: number; height: number };
} {
  'worklet';

  const targetSize = config.inputSize;

  if (!config.maintainAspectRatio) {
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
 * Convert YUV 4:2:0 to RGB using standard conversion matrix
 * Uses ITU-R BT.601 conversion standard
 */
function convertYUVtoRGB(yuvData: Uint8Array, width: number, height: number): Uint8Array {
  'worklet';
  
  console.log('YUV conversion input validation:');
  console.log('- Width:', width, 'Height:', height);
  console.log('- YUV data length:', yuvData.length);
  
  if (!yuvData || yuvData.length === 0) {
    throw new Error('YUV data is empty or null');
  }
  
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid dimensions: ${width}x${height}`);
  }
  
  const ySize = width * height;
  const uvSize = ySize / 4; // For 4:2:0 format
  const expectedSize = ySize + uvSize * 2; // Y + U + V
  
  console.log('- Expected YUV data size:', expectedSize);
  console.log('- Y plane size:', ySize);
  console.log('- U/V plane size each:', uvSize);
  
  if (yuvData.length < expectedSize) {
    console.warn(`YUV data too small. Expected: ${expectedSize}, Got: ${yuvData.length}`);
    // Try to proceed anyway, might be a different YUV format
  }
  
  const rgbData = new Uint8Array(width * height * 3);
  
  // YUV planes: Y (luma), U (Cb), V (Cr)
  const yPlane = yuvData.subarray(0, ySize);
  const uPlane = yuvData.subarray(ySize, ySize + uvSize);
  const vPlane = yuvData.subarray(ySize + uvSize, Math.min(yuvData.length, ySize + uvSize * 2));
  
  console.log('YUV planes lengths:', {
    Y: yPlane.length,
    U: uPlane.length, 
    V: vPlane.length
  });
  
  try {
    console.log('Starting YUV to RGB conversion loop...');
    let processedPixels = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const yIndex = y * width + x;
        const uvIndex = Math.floor(y / 2) * Math.floor(width / 2) + Math.floor(x / 2);
        const rgbIndex = yIndex * 3;
        
        // Bounds checking
        if (yIndex >= yPlane.length) {
          throw new Error(`Y index out of bounds: ${yIndex} >= ${yPlane.length}`);
        }
        if (uvIndex >= uPlane.length || uvIndex >= vPlane.length) {
          console.warn(`UV index out of bounds: ${uvIndex}, U length: ${uPlane.length}, V length: ${vPlane.length}`);
          // Use last available UV values
          const safeUVIndex = Math.min(uvIndex, Math.min(uPlane.length - 1, vPlane.length - 1));
          const Y = yPlane[yIndex];
          const U = (uPlane[safeUVIndex] || 128) - 128;
          const V = (vPlane[safeUVIndex] || 128) - 128;
          
          // ITU-R BT.601 conversion matrix
          let R = Y + 1.402 * V;
          let G = Y - 0.344 * U - 0.714 * V;
          let B = Y + 1.772 * U;
          
          // Clamp values to 0-255 range
          rgbData[rgbIndex] = Math.max(0, Math.min(255, Math.round(R)));
          rgbData[rgbIndex + 1] = Math.max(0, Math.min(255, Math.round(G)));
          rgbData[rgbIndex + 2] = Math.max(0, Math.min(255, Math.round(B)));
        } else {
          const Y = yPlane[yIndex];
          const U = uPlane[uvIndex] - 128; // Center around 0
          const V = vPlane[uvIndex] - 128; // Center around 0
          
          // ITU-R BT.601 conversion matrix
          let R = Y + 1.402 * V;
          let G = Y - 0.344 * U - 0.714 * V;
          let B = Y + 1.772 * U;
          
          // Clamp values to 0-255 range
          rgbData[rgbIndex] = Math.max(0, Math.min(255, Math.round(R)));     // R
          rgbData[rgbIndex + 1] = Math.max(0, Math.min(255, Math.round(G))); // G
          rgbData[rgbIndex + 2] = Math.max(0, Math.min(255, Math.round(B))); // B
        }
        
        processedPixels++;
      }
    }
    
    console.log(`YUV to RGB conversion completed. Processed ${processedPixels} pixels`);
    console.log(`RGB data length: ${rgbData.length}`);
    
    return rgbData;
    
  } catch (error) {
    console.error('YUV to RGB conversion failed:', error);
    throw new Error(`YUV conversion error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Simple nearest-neighbor resize for RGB data
 * For production use, consider bilinear or bicubic interpolation
 */
function resizeRGBData(
  rgbData: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Uint8Array {
  'worklet';
  
  const resizedData = new Uint8Array(dstWidth * dstHeight * 3);
  
  const scaleX = srcWidth / dstWidth;
  const scaleY = srcHeight / dstHeight;
  
  for (let dstY = 0; dstY < dstHeight; dstY++) {
    for (let dstX = 0; dstX < dstWidth; dstX++) {
      // Find nearest source pixel
      const srcX = Math.floor(dstX * scaleX);
      const srcY = Math.floor(dstY * scaleY);
      
      // Ensure we don't go out of bounds
      const clampedSrcX = Math.min(srcX, srcWidth - 1);
      const clampedSrcY = Math.min(srcY, srcHeight - 1);
      
      const srcIndex = (clampedSrcY * srcWidth + clampedSrcX) * 3;
      const dstIndex = (dstY * dstWidth + dstX) * 3;
      
      // Copy RGB values
      resizedData[dstIndex] = rgbData[srcIndex];         // R
      resizedData[dstIndex + 1] = rgbData[srcIndex + 1]; // G
      resizedData[dstIndex + 2] = rgbData[srcIndex + 2]; // B
    }
  }
  
  return resizedData;
}

/**
 * Convert uint8 values (0-255) to normalized float32 (0.0-1.0)
 */
function normalizeUint8ToFloat32(uint8Data: Uint8Array): Float32Array {
  'worklet';
  
  const float32Data = new Float32Array(uint8Data.length);
  
  for (let i = 0; i < uint8Data.length; i++) {
    float32Data[i] = uint8Data[i] / 255.0;
  }
  
  return float32Data;
}

/**
 * Process frame using the vision-camera-resize-plugin with hardware acceleration
 */
export function processWithResizePlugin(
  frame: Frame,
  resizeFunc: ResizeFunction,
  config: PreprocessingConfig = MOVENET_PREPROCESSING_CONFIG
): PreprocessingResult {
  'worklet';
  
  const startTime = Date.now();
  
  // Calculate target dimensions with aspect ratio handling
  const { targetWidth, targetHeight, cropConfig } = calculateDimensions(
    frame.width,
    frame.height,
    config
  );
  
  console.log('Target dimensions:', targetWidth, 'x', targetHeight);
  console.log('Crop config:', cropConfig);

  // Hardware-accelerated resize and format conversion
  console.log('Calling resize function...');
  const resizedBuffer = resizeFunc(frame, {
    scale: {
      width: targetWidth,
      height: targetHeight,
    },
    pixelFormat: 'rgb',
    dataType: config.outputFormat,
    crop: cropConfig,
  });
  
  console.log('Resize completed, result length:', resizedBuffer?.byteLength);
  
  if (!resizedBuffer) {
    throw new Error('Resize function returned null/undefined');
  }

  // Create properly typed array based on output format
  let processedData: Uint8Array | Float32Array;
  
  if (config.outputFormat === 'uint8') {
    processedData = new Uint8Array(resizedBuffer);
    
    // Optional normalization for uint8 (typically not needed for MoveNet)
    if (config.normalizeValues) {
      processedData = normalizeUint8ToFloat32(processedData);
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
}

/**
 * Process frame using native JavaScript implementation (fallback)
 */
export function processWithFallback(
  frame: Frame,
  config: PreprocessingConfig = MOVENET_PREPROCESSING_CONFIG
): PreprocessingResult {
  'worklet';
  
  const startTime = Date.now();
  
  try {
    console.log('Using fallback processing (no resize plugin available)');
    console.log('Frame details:', {
      width: frame.width,
      height: frame.height,
      pixelFormat: frame.pixelFormat,
      orientation: frame.orientation
    });
    
    // Get raw frame data
    console.log('Getting frame buffer...');
    const frameBuffer = frame.toArrayBuffer();
    
    if (!frameBuffer) {
      throw new Error('Frame buffer is null or undefined');
    }
    
    const frameData = new Uint8Array(frameBuffer);
    console.log('Raw frame data length:', frameData.length);
    console.log('Expected data length for', frame.width, 'x', frame.height, ':', frame.width * frame.height * 1.5, '(YUV 4:2:0)');
    
    // Calculate target dimensions
    console.log('Calculating target dimensions...');
    const { targetWidth, targetHeight } = calculateDimensions(
      frame.width,
      frame.height,
      config
    );
    
    console.log('Target dimensions:', targetWidth, 'x', targetHeight);
    
    let rgbData: Uint8Array;
    
    // Convert based on input pixel format
    if (frame.pixelFormat === 'yuv') {
      console.log('Converting YUV to RGB...');
      rgbData = convertYUVtoRGB(frameData, frame.width, frame.height);
      console.log('YUV conversion completed, RGB data length:', rgbData.length);
    } else if (frame.pixelFormat === 'rgb') {
      console.log('Frame already in RGB format');
      rgbData = frameData;
    } else {
      throw new Error(`Unsupported pixel format: ${frame.pixelFormat}`);
    }
    
    if (!rgbData || rgbData.length === 0) {
      throw new Error('RGB conversion failed - no data produced');
    }
    
    // Resize RGB data if needed
    console.log('Processing resize step...');
    let resizedData: Uint8Array;
    if (targetWidth !== frame.width || targetHeight !== frame.height) {
      console.log('Resizing from', frame.width, 'x', frame.height, 'to', targetWidth, 'x', targetHeight);
      resizedData = resizeRGBData(rgbData, frame.width, frame.height, targetWidth, targetHeight);
      console.log('Resize completed, data length:', resizedData.length);
    } else {
      console.log('No resizing needed');
      resizedData = rgbData;
    }
    
    if (!resizedData || resizedData.length === 0) {
      throw new Error('Resize failed - no data produced');
    }
    
    // Convert to final output format
    console.log('Converting to final output format...');
    let processedData: Uint8Array | Float32Array;
    if (config.outputFormat === 'uint8') {
      processedData = resizedData;
      if (config.normalizeValues) {
        processedData = normalizeUint8ToFloat32(processedData);
        console.log('Normalized to float32, length:', processedData.length);
      }
    } else {
      processedData = normalizeUint8ToFloat32(resizedData);
      console.log('Converted to float32, length:', processedData.length);
    }

    const processingTime = Date.now() - startTime;
    console.log('Fallback processing completed in', processingTime, 'ms');

    return {
      data: processedData,
      width: targetWidth,
      height: targetHeight,
      channels: 3, // RGB
      processingTime,
    };
    
  } catch (error) {
    console.error('Fallback processing failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
}

/**
 * Main preprocessing function using fallback processing
 * Worklet-compatible function for processing camera frames
 */
export function preprocessFrame(
  frame: Frame,
  config: PreprocessingConfig = MOVENET_PREPROCESSING_CONFIG
): PreprocessingResult {
  'worklet';
  
  return processWithFallback(frame, config);
}
