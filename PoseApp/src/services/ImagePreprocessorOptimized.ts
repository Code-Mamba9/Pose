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
 * Optimized YUV 4:2:0 to RGB conversion using vectorized operations
 * Uses ITU-R BT.601 conversion standard with performance optimizations
 */
function convertYUVtoRGBOptimized(yuvData: Uint8Array, width: number, height: number): Uint8Array {
  'worklet';
  
  const startTime = Date.now();
  
  if (!yuvData || yuvData.length === 0) {
    throw new Error('YUV data is empty or null');
  }
  
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid dimensions: ${width}x${height}`);
  }
  
  const ySize = width * height;
  const uvSize = ySize / 4; // For 4:2:0 format
  
  // Pre-allocate result array
  const rgbData = new Uint8Array(ySize * 3);
  
  // Get YUV planes with bounds checking
  const yPlane = yuvData.subarray(0, ySize);
  const uPlane = yuvData.subarray(ySize, ySize + uvSize);
  const vPlane = yuvData.subarray(ySize + uvSize, Math.min(yuvData.length, ySize + uvSize * 2));
  
  // Pre-calculate constants to avoid repeated calculations
  const halfWidth = width >>> 1; // Bit shift for division by 2
  const uvWidth = halfWidth;
  
  // ITU-R BT.601 conversion coefficients (pre-calculated for performance)
  const R_V_COEFF = 1.402;
  const G_U_COEFF = -0.344;
  const G_V_COEFF = -0.714;
  const B_U_COEFF = 1.772;
  
  // Process in 2x2 pixel blocks to maximize UV reuse
  let rgbIndex = 0;
  let processedPixels = 0;
  
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      // UV coordinates (shared by 2x2 block)
      const uvY = y >>> 1; // Bit shift for division by 2
      const uvX = x >>> 1;
      const uvIndex = uvY * uvWidth + uvX;
      
      // Bounds check for UV
      const safeUVIndex = Math.min(uvIndex, Math.min(uPlane.length - 1, vPlane.length - 1));
      
      // Get UV values (centered around 0) - shared by 2x2 block
      const U = (uPlane[safeUVIndex] || 128) - 128;
      const V = (vPlane[safeUVIndex] || 128) - 128;
      
      // Pre-calculate UV contribution to RGB
      const R_UV = R_V_COEFF * V;
      const G_UV = G_U_COEFF * U + G_V_COEFF * V;
      const B_UV = B_U_COEFF * U;
      
      // Process 2x2 block of pixels
      for (let blockY = 0; blockY < 2 && (y + blockY) < height; blockY++) {
        for (let blockX = 0; blockX < 2 && (x + blockX) < width; blockX++) {
          const currentY = y + blockY;
          const currentX = x + blockX;
          const yIndex = currentY * width + currentX;
          
          // Bounds check for Y
          if (yIndex < yPlane.length) {
            const Y = yPlane[yIndex];
            
            // Apply conversion with pre-calculated UV contributions
            const R = Y + R_UV;
            const G = Y + G_UV;
            const B = Y + B_UV;
            
            // Fast clamping using bitwise operations for better performance
            const rgbIdx = (currentY * width + currentX) * 3;
            rgbData[rgbIdx] = (R < 0) ? 0 : (R > 255) ? 255 : (R + 0.5) | 0;     // R
            rgbData[rgbIdx + 1] = (G < 0) ? 0 : (G > 255) ? 255 : (G + 0.5) | 0; // G
            rgbData[rgbIdx + 2] = (B < 0) ? 0 : (B > 255) ? 255 : (B + 0.5) | 0; // B
            
            processedPixels++;
          }
        }
      }
    }
  }
  
  const conversionTime = Date.now() - startTime;
  console.log(`Optimized YUV→RGB conversion: ${processedPixels} pixels in ${conversionTime}ms (${(processedPixels/conversionTime/1000).toFixed(1)}M pixels/sec)`);
  
  return rgbData;
}

/**
 * Optimized nearest-neighbor resize using integer arithmetic
 */
function resizeRGBDataOptimized(
  rgbData: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): Uint8Array {
  'worklet';
  
  const startTime = Date.now();
  
  // Pre-allocate result
  const resizedData = new Uint8Array(dstWidth * dstHeight * 3);
  
  // Use fixed-point arithmetic for better performance
  const SCALE_BITS = 16;
  const SCALE_FACTOR = 1 << SCALE_BITS;
  
  const scaleX = Math.floor((srcWidth * SCALE_FACTOR) / dstWidth);
  const scaleY = Math.floor((srcHeight * SCALE_FACTOR) / dstHeight);
  
  let dstIdx = 0;
  
  for (let dstY = 0; dstY < dstHeight; dstY++) {
    // Calculate source Y coordinate using fixed-point arithmetic
    const srcYFixed = dstY * scaleY;
    const srcY = Math.min((srcYFixed >> SCALE_BITS), srcHeight - 1);
    const srcYOffset = srcY * srcWidth * 3;
    
    for (let dstX = 0; dstX < dstWidth; dstX++) {
      // Calculate source X coordinate using fixed-point arithmetic
      const srcXFixed = dstX * scaleX;
      const srcX = Math.min((srcXFixed >> SCALE_BITS), srcWidth - 1);
      const srcIdx = srcYOffset + srcX * 3;
      
      // Copy RGB values (unrolled for performance)
      resizedData[dstIdx] = rgbData[srcIdx];         // R
      resizedData[dstIdx + 1] = rgbData[srcIdx + 1]; // G
      resizedData[dstIdx + 2] = rgbData[srcIdx + 2]; // B
      dstIdx += 3;
    }
  }
  
  const resizeTime = Date.now() - startTime;
  console.log(`Optimized resize: ${srcWidth}x${srcHeight}→${dstWidth}x${dstHeight} in ${resizeTime}ms`);
  
  return resizedData;
}

/**
 * Optimized uint8 to float32 normalization using vectorized operations
 */
function normalizeUint8ToFloat32Optimized(uint8Data: Uint8Array): Float32Array {
  'worklet';
  
  const startTime = Date.now();
  const float32Data = new Float32Array(uint8Data.length);
  
  // Process in chunks for better cache performance
  const CHUNK_SIZE = 1024;
  const length = uint8Data.length;
  
  for (let i = 0; i < length; i += CHUNK_SIZE) {
    const end = Math.min(i + CHUNK_SIZE, length);
    
    // Unroll loop for small chunks
    for (let j = i; j < end; j++) {
      float32Data[j] = uint8Data[j] * 0.00392156862745098; // 1/255 pre-calculated
    }
  }
  
  const normalizeTime = Date.now() - startTime;
  console.log(`Optimized normalization: ${length} values in ${normalizeTime}ms`);
  
  return float32Data;
}

/**
 * Calculate optimal dimensions with minimal calculations
 */
function calculateDimensionsOptimized(
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
    return {
      targetWidth: targetSize,
      targetHeight: targetSize,
    };
  }

  // Use integer arithmetic for aspect ratio calculations
  const frameAspect = (frameWidth << 16) / frameHeight; // Fixed-point
  const targetAspect = 1 << 16; // 1.0 in fixed-point

  let cropConfig;

  if (frameAspect > targetAspect) {
    // Frame is wider - crop horizontally
    const cropWidth = Math.floor((frameHeight * targetAspect) >> 16);
    const cropX = (frameWidth - cropWidth) >> 1; // Bit shift for division by 2
    
    cropConfig = {
      x: Math.max(0, cropX),
      y: 0,
      width: cropWidth,
      height: frameHeight,
    };
  } else if (frameAspect < targetAspect) {
    // Frame is taller - crop vertically
    const cropHeight = Math.floor((frameWidth << 16) / targetAspect) >> 16;
    const cropY = (frameHeight - cropHeight) >> 1;
    
    cropConfig = {
      x: 0,
      y: Math.max(0, cropY),
      width: frameWidth,
      height: cropHeight,
    };
  }

  return {
    targetWidth: targetSize,
    targetHeight: targetSize,
    cropConfig,
  };
}

/**
 * Optimized main preprocessing function with performance monitoring
 */
export function preprocessFrameOptimized(
  frame: Frame,
  config: PreprocessingConfig = MOVENET_PREPROCESSING_CONFIG
): PreprocessingResult {
  'worklet';
  
  const totalStartTime = Date.now();

  try {
    console.log(`Starting optimized preprocessing: ${frame.width}x${frame.height} ${frame.pixelFormat}`);
    
    // Get frame data
    const frameBuffer = frame.toArrayBuffer();
    if (!frameBuffer) {
      throw new Error('Frame buffer is null or undefined');
    }
    
    const frameData = new Uint8Array(frameBuffer);
    
    // Calculate target dimensions
    const { targetWidth, targetHeight } = calculateDimensionsOptimized(
      frame.width,
      frame.height,
      config
    );
    
    let rgbData: Uint8Array;
    
    // Convert based on input pixel format
    if (frame.pixelFormat === 'yuv') {
      rgbData = convertYUVtoRGBOptimized(frameData, frame.width, frame.height);
    } else if (frame.pixelFormat === 'rgb') {
      rgbData = frameData;
    } else {
      throw new Error(`Unsupported pixel format: ${frame.pixelFormat}`);
    }
    
    // Resize if needed
    let resizedData: Uint8Array;
    if (targetWidth !== frame.width || targetHeight !== frame.height) {
      resizedData = resizeRGBDataOptimized(rgbData, frame.width, frame.height, targetWidth, targetHeight);
    } else {
      resizedData = rgbData;
    }
    
    // Convert to final output format
    let processedData: Uint8Array | Float32Array;
    if (config.outputFormat === 'uint8') {
      processedData = resizedData;
      if (config.normalizeValues) {
        processedData = normalizeUint8ToFloat32Optimized(processedData);
      }
    } else {
      processedData = normalizeUint8ToFloat32Optimized(resizedData);
    }

    const totalTime = Date.now() - totalStartTime;
    console.log(`Total optimized preprocessing: ${totalTime}ms`);

    return {
      data: processedData,
      width: targetWidth,
      height: targetHeight,
      channels: 3,
      processingTime: totalTime,
    };
    
  } catch (error) {
    console.error('Optimized preprocessing failed:', error);
    throw error;
  }
}