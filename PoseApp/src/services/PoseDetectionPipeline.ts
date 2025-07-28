import type { Frame } from 'react-native-vision-camera';
import { preprocessFrame, MOVENET_PREPROCESSING_CONFIG, type PreprocessingResult } from './ImagePreprocessorFunctions';
import { preprocessFrameOptimized } from './ImagePreprocessorOptimized';
import { 
  extractPoseKeypoints, 
  DEFAULT_KEYPOINT_CONFIG,
  type PoseDetectionResult,
  type KeypointExtractionConfig 
} from './KeypointExtractor';
import { generateMockMoveNetOutput } from './MockMoveNetOutput';

/**
 * Configuration for the complete pose detection pipeline
 */
export interface PoseDetectionConfig {
  useOptimizedPreprocessing: boolean;
  preprocessingConfig: typeof MOVENET_PREPROCESSING_CONFIG;
  keypointConfig: KeypointExtractionConfig;
  enableMockMode: boolean; // For testing without actual model inference
  mockScenario?: 'standing' | 'sitting' | 'partial' | 'low_confidence';
}

/**
 * Complete pipeline result including preprocessing and keypoint extraction
 */
export interface PipelineResult {
  preprocessing: PreprocessingResult;
  poseDetection: PoseDetectionResult;
  totalProcessingTime: number;
  success: boolean;
  error?: string;
}

/**
 * Default pipeline configuration optimized for real-time performance
 */
export const DEFAULT_PIPELINE_CONFIG: PoseDetectionConfig = {
  useOptimizedPreprocessing: true,
  preprocessingConfig: MOVENET_PREPROCESSING_CONFIG,
  keypointConfig: {
    ...DEFAULT_KEYPOINT_CONFIG,
    confidenceThreshold: 0.3,
    screenWidth: 192,
    screenHeight: 192,
  },
  enableMockMode: false,
};

/**
 * Simulate TensorFlow Lite model inference with mock data
 * In production, this would be replaced with actual TFLite model execution
 */
function simulateModelInference(
  preprocessedData: Uint8Array | Float32Array,
  mockScenario: 'standing' | 'sitting' | 'partial' | 'low_confidence' = 'standing'
): Float32Array {
  'worklet';
  
  console.log('Simulating model inference...', {
    inputDataLength: preprocessedData.length,
    inputDataType: preprocessedData.constructor.name,
    mockScenario
  });
  
  // In a real implementation, this would be:
  // return tfliteModel.run(preprocessedData);
  
  // For testing, return mock MoveNet output
  return generateMockMoveNetOutput(mockScenario);
}

/**
 * Complete pose detection pipeline from camera frame to keypoints
 */
export function processPoseDetection(
  frame: Frame,
  config: PoseDetectionConfig = DEFAULT_PIPELINE_CONFIG
): PipelineResult {
  'worklet';
  
  const totalStartTime = Date.now();
  
  try {
    console.log('=== Pose Detection Pipeline Start ===');
    console.log('Frame input:', {
      width: frame.width,
      height: frame.height,
      pixelFormat: frame.pixelFormat
    });
    
    console.log('Pipeline config:', {
      useOptimizedPreprocessing: config.useOptimizedPreprocessing,
      enableMockMode: config.enableMockMode,
      mockScenario: config.mockScenario,
      confidenceThreshold: config.keypointConfig.confidenceThreshold
    });
    
    // Step 1: Preprocess the camera frame
    console.log('Step 1: Preprocessing frame...');
    const preprocessingResult = config.useOptimizedPreprocessing
      ? preprocessFrameOptimized(frame, config.preprocessingConfig)
      : preprocessFrame(frame, config.preprocessingConfig);
    
    console.log('Preprocessing completed:', {
      outputWidth: preprocessingResult.width,
      outputHeight: preprocessingResult.height,
      channels: preprocessingResult.channels,
      dataType: preprocessingResult.data.constructor.name,
      dataLength: preprocessingResult.data.length,
      processingTime: preprocessingResult.processingTime
    });
    
    // Step 2: Run model inference (simulated for now)
    console.log('Step 2: Running model inference...');
    const modelOutput = config.enableMockMode
      ? generateMockMoveNetOutput(config.mockScenario || 'standing')
      : simulateModelInference(preprocessingResult.data, config.mockScenario || 'standing');
    
    console.log('Model inference completed:', {
      outputLength: modelOutput.length,
      outputType: modelOutput.constructor.name
    });
    
    // Step 3: Extract keypoints from model output
    console.log('Step 3: Extracting keypoints...');
    const updatedKeypointConfig: KeypointExtractionConfig = {
      ...config.keypointConfig,
      screenWidth: frame.width,  // Use actual frame dimensions
      screenHeight: frame.height,
    };
    
    const poseDetectionResult = extractPoseKeypoints(modelOutput, updatedKeypointConfig);
    
    console.log('Keypoint extraction completed:', {
      overallConfidence: poseDetectionResult.overallConfidence.toFixed(3),
      validKeypoints: poseDetectionResult.validKeypoints,
      totalKeypoints: 17,
      processingTime: poseDetectionResult.processingTime
    });
    
    const totalProcessingTime = Date.now() - totalStartTime;
    
    console.log('=== Pipeline Completed ===');
    console.log('Total processing time:', totalProcessingTime, 'ms');
    console.log('Performance breakdown:', {
      preprocessing: `${preprocessingResult.processingTime}ms (${((preprocessingResult.processingTime / totalProcessingTime) * 100).toFixed(1)}%)`,
      keypoint_extraction: `${poseDetectionResult.processingTime}ms (${((poseDetectionResult.processingTime / totalProcessingTime) * 100).toFixed(1)}%)`,
      total: `${totalProcessingTime}ms`
    });
    
    return {
      preprocessing: preprocessingResult,
      poseDetection: poseDetectionResult,
      totalProcessingTime,
      success: true,
    };
    
  } catch (error) {
    const totalProcessingTime = Date.now() - totalStartTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
    
    console.error('=== Pipeline Failed ===');
    console.error('Error:', errorMessage);
    console.error('Processing time before failure:', totalProcessingTime, 'ms');
    
    // Return a failed result with default values
    return {
      preprocessing: {
        data: new Uint8Array(0),
        width: 0,
        height: 0,
        channels: 0,
        processingTime: 0,
      },
      poseDetection: {
        keypoints: {} as any,
        screenKeypoints: {} as any,
        overallConfidence: 0,
        validKeypoints: 0,
        processingTime: 0,
        frameWidth: frame.width,
        frameHeight: frame.height,
      },
      totalProcessingTime,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Batch test the pipeline with multiple scenarios
 */
export function runPipelineBenchmark(
  frame: Frame,
  iterations: number = 5
): Array<{
  scenario: string;
  avgProcessingTime: number;
  avgConfidence: number;
  avgValidKeypoints: number;
  successRate: number;
}> {
  'worklet';
  
  console.log('=== Pipeline Benchmark Start ===');
  console.log('Running', iterations, 'iterations per scenario');
  
  const scenarios: Array<{
    name: string;
    config: PoseDetectionConfig;
  }> = [
    {
      name: 'Optimized + Standing',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
        useOptimizedPreprocessing: true,
        enableMockMode: true,
        mockScenario: 'standing',
      }
    },
    {
      name: 'Standard + Standing',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
        useOptimizedPreprocessing: false,
        enableMockMode: true,
        mockScenario: 'standing',
      }
    },
    {
      name: 'Optimized + Partial',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
        useOptimizedPreprocessing: true,
        enableMockMode: true,
        mockScenario: 'partial',
      }
    },
    {
      name: 'Optimized + Low Confidence',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
        useOptimizedPreprocessing: true,
        enableMockMode: true,
        mockScenario: 'low_confidence',
      }
    },
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    console.log('Testing scenario:', scenario.name);
    
    const times: number[] = [];
    const confidences: number[] = [];
    const validKeypoints: number[] = [];
    let successCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      try {
        const result = processPoseDetection(frame, scenario.config);
        
        if (result.success) {
          times.push(result.totalProcessingTime);
          confidences.push(result.poseDetection.overallConfidence);
          validKeypoints.push(result.poseDetection.validKeypoints);
          successCount++;
        }
      } catch (error) {
        console.warn('Iteration failed:', error);
      }
    }
    
    const avgProcessingTime = times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0;
    const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b) / confidences.length : 0;
    const avgValidKeypoints = validKeypoints.length > 0 ? validKeypoints.reduce((a, b) => a + b) / validKeypoints.length : 0;
    const successRate = successCount / iterations;
    
    results.push({
      scenario: scenario.name,
      avgProcessingTime,
      avgConfidence,
      avgValidKeypoints,
      successRate,
    });
    
    console.log('Scenario results:', {
      scenario: scenario.name,
      avgProcessingTime: avgProcessingTime.toFixed(1) + 'ms',
      avgConfidence: (avgConfidence * 100).toFixed(1) + '%',
      avgValidKeypoints: avgValidKeypoints.toFixed(1),
      successRate: (successRate * 100).toFixed(1) + '%'
    });
  }
  
  console.log('=== Benchmark Completed ===');
  
  return results;
}

/**
 * Get pipeline performance metrics
 */
export function getPipelineMetrics(result: PipelineResult): {
  fps: number;
  preprocessingShare: number;
  keypointExtractionShare: number;
  isRealtime: boolean;
} {
  'worklet';
  
  const fps = result.totalProcessingTime > 0 ? 1000 / result.totalProcessingTime : 0;
  const preprocessingShare = result.preprocessing.processingTime / result.totalProcessingTime;
  const keypointExtractionShare = result.poseDetection.processingTime / result.totalProcessingTime;
  const isRealtime = fps >= 25; // 25 FPS threshold for real-time performance
  
  return {
    fps,
    preprocessingShare,
    keypointExtractionShare,
    isRealtime,
  };
}