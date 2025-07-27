import React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useFrameProcessor, type Frame, type CameraDevice } from 'react-native-vision-camera';
import { preprocessFrame, MOVENET_PREPROCESSING_CONFIG } from '../services/ImagePreprocessorFunctions';

interface ImagePreprocessorDemoProps {
  useFallback?: boolean; // Option to test fallback processing
  device: CameraDevice;
}

/**
 * Demo component showing fallback preprocessing approach
 * Uses native JavaScript implementation instead of resize plugin
 */
export const ImagePreprocessorDemo: React.FC<ImagePreprocessorDemoProps> = ({ 
  useFallback = true, // Default to fallback since plugin may not be available
  device
}) => {
  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    
    try {
      console.log('=== Frame Processor Start ===');
      console.log('Frame properties:', {
        width: frame.width,
        height: frame.height,
        pixelFormat: frame.pixelFormat,
        orientation: frame.orientation
      });
      
      // Test frame.toArrayBuffer() directly
      console.log('Testing frame.toArrayBuffer()...');
      const testBuffer = frame.toArrayBuffer();
      console.log('Buffer test result:', {
        bufferExists: !!testBuffer,
        bufferLength: testBuffer?.byteLength || 0
      });
      
      if (!testBuffer) {
        throw new Error('frame.toArrayBuffer() returned null/undefined');
      }
      
      // Preprocess the frame for MoveNet using function approach
      console.log('Calling preprocessFrame function...');
      const result = preprocessFrame(frame, MOVENET_PREPROCESSING_CONFIG);
      
      console.log('Preprocessing completed:', {
        width: result.width,
        height: result.height,
        channels: result.channels,
        dataType: result.data.constructor.name,
        dataLength: result.data.length,
        processingTime: result.processingTime
      });
      
      // Here you would typically pass the result to your ML model
      // Example: runMoveNetInference(result.data);
      
    } catch (error) {
      console.error('Frame preprocessing error:');
      console.error('Error message:', error?.message || 'No message');
      console.error('Error name:', error?.name || 'No name');
      console.error('Error stack:', error?.stack || 'No stack');
      console.error('Full error object:', error);
    }
  }, []);

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      pixelFormat='yuv' // Use YUV for optimal performance with fallback processing
    />
  );
};

const styles = StyleSheet.create({
  // Add any styles if needed
});