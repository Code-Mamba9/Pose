import { useCallback, useMemo } from 'react';
import { 
  ImagePreprocessor, 
  PreprocessingConfig, 
  PreprocessingResult,
  MOVENET_PREPROCESSING_CONFIG,
  createMoveNetPreprocessor 
} from '../services/ImagePreprocessor';
import type { Frame } from 'react-native-vision-camera';

export interface UseImagePreprocessorProps {
  config?: Partial<PreprocessingConfig>;
  onPreprocessingComplete?: (result: PreprocessingResult) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for managing image preprocessing with performance monitoring
 */
export function useImagePreprocessor({
  config = {},
  onPreprocessingComplete,
  onError,
}: UseImagePreprocessorProps = {}) {
  
  // Create preprocessor instance with merged config
  const preprocessor = useMemo(() => {
    const finalConfig = { ...MOVENET_PREPROCESSING_CONFIG, ...config };
    return new ImagePreprocessor(finalConfig);
  }, [config]);

  // Create a simple worklet function (avoiding useCallback)
  const preprocessFrame = (frame: Frame): PreprocessingResult | null => {
    'worklet';
    
    try {
      // Check if preprocessor exists
      if (!preprocessor) {
        console.error('Preprocessor is null/undefined');
        return null;
      }
      
      // Check if preprocessFrame method exists
      if (typeof preprocessor.preprocessFrame !== 'function') {
        console.error('preprocessor.preprocessFrame is not a function (it is', typeof preprocessor.preprocessFrame, ')');
        return null;
      }
      
      // Check if frame is valid
      if (!frame || !frame.width || !frame.height) {
        console.error('Invalid frame:', frame?.width, frame?.height);
        return null;
      }
      
      const result = preprocessor.preprocessFrame(frame);
      
      // Call completion callback if provided (must be worklet-compatible)
      if (onPreprocessingComplete) {
        onPreprocessingComplete(result);
      }
      
      return result;
    } catch (error) {
      // Better error logging for worklets
      console.error('Preprocessing failed in hook:');
      console.error('Error message:', error?.message || 'Unknown error');
      console.error('Error name:', error?.name || 'Unknown');
      console.error('Full error:', JSON.stringify(error));
      
      // Call error callback if provided
      if (onError) {
        onError(error as Error);
      }
      
      return null;
    }
  };

  // Non-worklet function for updating config
  const updateConfig = useCallback((newConfig: Partial<PreprocessingConfig>) => {
    preprocessor.updateConfig(newConfig);
  }, [preprocessor]);

  // Get current configuration
  const getCurrentConfig = useCallback(() => {
    return preprocessor.getConfig();
  }, [preprocessor]);

  return {
    preprocessFrame,
    updateConfig,
    getCurrentConfig,
    preprocessor,
  };
}

/**
 * Hook specifically configured for MoveNet Lightning preprocessing
 */
export function useMoveNetPreprocessor() {
  return useImagePreprocessor({
    config: MOVENET_PREPROCESSING_CONFIG,
  });
}