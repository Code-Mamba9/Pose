import React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useFrameProcessor, type Frame } from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { createMoveNetPreprocessor } from '../services/ImagePreprocessor';

interface ImagePreprocessorDemoProps {
  // Add any props you need
}

/**
 * Demo component showing correct usage of ImagePreprocessor with vision-camera-resize-plugin
 */
export const ImagePreprocessorDemo: React.FC<ImagePreprocessorDemoProps> = () => {
  // Get the resize function from the hook
  const { resize } = useResizePlugin();
  
  // Create the preprocessor with the resize function
  const preprocessor = React.useMemo(() => {
    return createMoveNetPreprocessor(resize);
  }, [resize]);

  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    
    try {
      // Preprocess the frame for MoveNet
      const result = preprocessor.preprocessFrame(frame);
      
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
      console.error('Frame preprocessing error:', error);
    }
  }, [preprocessor]);

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      frameProcessor={frameProcessor}
      // Add other camera props as needed
    />
  );
};

const styles = StyleSheet.create({
  // Add any styles if needed
});