import type { Frame } from 'react-native-vision-camera';
import { 
  preprocessFrame,
  MOVENET_PREPROCESSING_CONFIG, 
  type PreprocessingResult 
} from './ImagePreprocessor';
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
  preprocessingConfig: typeof MOVENET_PREPROCESSING_CONFIG;
  keypointConfig: KeypointExtractionConfig;
  enableMockMode: boolean; // For testing without actual model inference
  mockScenario?: 'standing' | 'sitting' | 'partial' | 'low_confidence';
  model?: any; // TensorFlow Lite model for real inference
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
  preprocessingConfig: MOVENET_PREPROCESSING_CONFIG,
  keypointConfig: {
    ...DEFAULT_KEYPOINT_CONFIG,
    confidenceThreshold: 0.1,
    screenWidth: 192,
    screenHeight: 192,
  },
  enableMockMode: false,
};



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
    // Step 1: Preprocess the camera frame using optimized preprocessing functions
    // Uses software fallback with optimized algorithms (hardware acceleration available via processWithResizePlugin)
    const preprocessingResult = preprocessFrame(frame, config.preprocessingConfig);
    
    // Step 2: Run model inference (real TensorFlow Lite or mock)
    let modelOutput: Float32Array;
    
    if (config.enableMockMode) {
      modelOutput = generateMockMoveNetOutput(config.mockScenario || 'standing');
    } else if (config.model) {
      try {
        const modelOutputs = config.model.runSync([preprocessingResult.data]);
        
        if (!modelOutputs || modelOutputs.length === 0) {
          throw new Error('Model returned no outputs');
        }
        
        modelOutput = modelOutputs[0];
        
      } catch (inferenceError) {
        console.warn('Real inference failed, falling back to mock:', inferenceError);
        modelOutput = generateMockMoveNetOutput(config.mockScenario || 'standing');
      }
    } else {
      modelOutput = generateMockMoveNetOutput(config.mockScenario || 'standing');
    }
    
    // Step 3: Extract keypoints from model output
    const updatedKeypointConfig: KeypointExtractionConfig = {
      ...config.keypointConfig,
      screenWidth: frame.width,  // Use actual frame dimensions
      screenHeight: frame.height,
    };
    
    const poseDetectionResult = extractPoseKeypoints(modelOutput, updatedKeypointConfig);
    
    const totalProcessingTime = Date.now() - totalStartTime;
    
    console.log(`Pipeline: ${totalProcessingTime}ms (prep: ${preprocessingResult.processingTime}ms, conf: ${(poseDetectionResult.overallConfidence * 100).toFixed(1)}%, valid: ${poseDetectionResult.validKeypoints}/17)`);
    
    return {
      preprocessing: preprocessingResult,
      poseDetection: poseDetectionResult,
      totalProcessingTime,
      success: true,
    };
    
  } catch (error) {
    const totalProcessingTime = Date.now() - totalStartTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
    
    console.error('Pipeline failed:', errorMessage, `(${totalProcessingTime}ms)`);
    
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
      name: 'Standing',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
        enableMockMode: true,
        mockScenario: 'standing',
      }
    },
    {
      name: 'Sitting',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
        enableMockMode: true,
        mockScenario: 'sitting',
      }
    },
    {
      name: 'Partial',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
        enableMockMode: true,
        mockScenario: 'partial',
      }
    },
    {
      name: 'Low Confidence',
      config: {
        ...DEFAULT_PIPELINE_CONFIG,
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
