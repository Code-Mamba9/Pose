import type { Frame } from 'react-native-vision-camera';

export interface SimplePreprocessingResult {
  data: Uint8Array | Float32Array;
  width: number;
  height: number;
  channels: number;
  processingTime: number;
}

/**
 * Simple functional preprocessor for MoveNet
 * Basic implementation without resize plugin for testing
 */
export function preprocessFrameForMoveNet(frame: Frame): SimplePreprocessingResult {
  'worklet';
  
  const startTime = Date.now();
  
  try {
    console.log('Simple preprocessor: Starting for frame:', frame.width, 'x', frame.height);
    
    // For now, create mock data that represents 192x192x3 RGB image
    // This is a placeholder until we can properly configure the resize plugin
    const targetSize = 192;
    const channels = 3;
    const totalPixels = targetSize * targetSize * channels;
    
    // Create mock preprocessed data (uint8 values 0-255)
    const mockData = new Uint8Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      mockData[i] = Math.floor(Math.random() * 256); // Random RGB values for testing
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log('Simple preprocessor: Mock data created, length:', mockData.length);
    
    return {
      data: mockData,
      width: targetSize,
      height: targetSize,
      channels: channels,
      processingTime,
    };
    
  } catch (error) {
    console.error('Simple preprocessor failed:', error);
    throw error;
  }
}

/**
 * Preprocessor using vision-camera-resize-plugin (when available)
 * Separate function to isolate plugin dependencies
 */
export function preprocessFrameWithResize(frame: Frame): SimplePreprocessingResult {
  'worklet';
  
  const startTime = Date.now();
  
  try {
    // Dynamic import to avoid compile-time errors if plugin not available
    const { resize } = require('vision-camera-resize-plugin');
    
    console.log('Resize preprocessor: Starting for frame:', frame.width, 'x', frame.height);
    
    // MoveNet Lightning expects 192x192 input
    const targetSize = 192;
    
    // Calculate crop for square aspect ratio
    const minDimension = Math.min(frame.width, frame.height);
    const cropX = (frame.width - minDimension) / 2;
    const cropY = (frame.height - minDimension) / 2;
    
    const cropConfig = {
      x: Math.floor(cropX),
      y: Math.floor(cropY),
      width: minDimension,
      height: minDimension,
    };
    
    console.log('Resize preprocessor: Crop config:', cropConfig);
    
    // Resize with hardware acceleration
    const resized = resize(frame, {
      scale: {
        width: targetSize,
        height: targetSize,
      },
      pixelFormat: 'rgb',
      dataType: 'uint8',
      crop: cropConfig,
    });
    
    if (!resized) {
      throw new Error('Resize returned null');
    }
    
    console.log('Resize preprocessor: Resize completed, length:', resized.length);
    
    const processedData = new Uint8Array(resized);
    const processingTime = Date.now() - startTime;
    
    return {
      data: processedData,
      width: targetSize,
      height: targetSize,
      channels: 3,
      processingTime,
    };
    
  } catch (error) {
    console.error('Resize preprocessor failed:', error);
    throw error;
  }
}