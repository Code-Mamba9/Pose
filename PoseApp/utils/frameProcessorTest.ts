import { useFrameProcessor } from 'react-native-vision-camera';

/**
 * Test frame processor to verify worklets are working
 */
export const useTestFrameProcessor = () => {
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    // This should run at camera FPS
    console.log(`Frame processed: ${frame.width}x${frame.height}`);
    
    // Test that we can access frame properties
    const frameInfo = {
      width: frame.width,
      height: frame.height,
      pixelFormat: frame.pixelFormat,
      timestamp: frame.timestamp
    };
    
    // This would be where we'd call pose detection
    // processPoseDetection(frame);
    
    return frameInfo;
  }, []);

  return frameProcessor;
};