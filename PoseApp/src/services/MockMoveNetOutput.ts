/**
 * Mock MoveNet output generator for testing keypoint extraction
 * Creates realistic test data matching MoveNet's actual output format
 */

import { KEYPOINT_INDICES } from './KeypointExtractor';

/**
 * Generate mock MoveNet output tensor for testing
 * Returns a Float32Array with shape [1, 1, 17, 3] flattened to [51]
 */
export function generateMockMoveNetOutput(scenario: 'standing' | 'sitting' | 'partial' | 'low_confidence' = 'standing'): Float32Array {
  'worklet';
  
  // Initialize output array: 1 batch * 1 person * 17 keypoints * 3 values = 51 total
  const output = new Float32Array(51);
  
  // Helper to set keypoint values: [y, x, confidence]
  const setKeypoint = (index: number, y: number, x: number, confidence: number) => {
    const baseIdx = index * 3;
    output[baseIdx] = y;     // Y coordinate (normalized 0-1)
    output[baseIdx + 1] = x; // X coordinate (normalized 0-1)  
    output[baseIdx + 2] = confidence; // Confidence (0-1)
  };
  
  switch (scenario) {
    case 'standing': {
      // Standing person, facing camera
      // Head keypoints
      setKeypoint(KEYPOINT_INDICES.nose, 0.15, 0.5, 0.95);
      setKeypoint(KEYPOINT_INDICES.leftEye, 0.12, 0.48, 0.90);
      setKeypoint(KEYPOINT_INDICES.rightEye, 0.12, 0.52, 0.90);
      setKeypoint(KEYPOINT_INDICES.leftEar, 0.15, 0.45, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightEar, 0.15, 0.55, 0.85);
      
      // Upper body keypoints
      setKeypoint(KEYPOINT_INDICES.leftShoulder, 0.25, 0.42, 0.95);
      setKeypoint(KEYPOINT_INDICES.rightShoulder, 0.25, 0.58, 0.95);
      setKeypoint(KEYPOINT_INDICES.leftElbow, 0.35, 0.38, 0.90);
      setKeypoint(KEYPOINT_INDICES.rightElbow, 0.35, 0.62, 0.90);
      setKeypoint(KEYPOINT_INDICES.leftWrist, 0.45, 0.35, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightWrist, 0.45, 0.65, 0.85);
      
      // Lower body keypoints
      setKeypoint(KEYPOINT_INDICES.leftHip, 0.55, 0.45, 0.92);
      setKeypoint(KEYPOINT_INDICES.rightHip, 0.55, 0.55, 0.92);
      setKeypoint(KEYPOINT_INDICES.leftKnee, 0.70, 0.46, 0.88);
      setKeypoint(KEYPOINT_INDICES.rightKnee, 0.70, 0.54, 0.88);
      setKeypoint(KEYPOINT_INDICES.leftAnkle, 0.85, 0.47, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightAnkle, 0.85, 0.53, 0.85);
      break;
    }
    
    case 'sitting': {
      // Sitting person, legs partially occluded
      // Head keypoints (similar to standing)
      setKeypoint(KEYPOINT_INDICES.nose, 0.20, 0.5, 0.90);
      setKeypoint(KEYPOINT_INDICES.leftEye, 0.17, 0.48, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightEye, 0.17, 0.52, 0.85);
      setKeypoint(KEYPOINT_INDICES.leftEar, 0.20, 0.45, 0.80);
      setKeypoint(KEYPOINT_INDICES.rightEar, 0.20, 0.55, 0.80);
      
      // Upper body keypoints
      setKeypoint(KEYPOINT_INDICES.leftShoulder, 0.30, 0.42, 0.90);
      setKeypoint(KEYPOINT_INDICES.rightShoulder, 0.30, 0.58, 0.90);
      setKeypoint(KEYPOINT_INDICES.leftElbow, 0.40, 0.38, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightElbow, 0.40, 0.62, 0.85);
      setKeypoint(KEYPOINT_INDICES.leftWrist, 0.50, 0.35, 0.80);
      setKeypoint(KEYPOINT_INDICES.rightWrist, 0.50, 0.65, 0.80);
      
      // Lower body keypoints (sitting position)
      setKeypoint(KEYPOINT_INDICES.leftHip, 0.55, 0.45, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightHip, 0.55, 0.55, 0.85);
      setKeypoint(KEYPOINT_INDICES.leftKnee, 0.65, 0.40, 0.70); // Bent knee
      setKeypoint(KEYPOINT_INDICES.rightKnee, 0.65, 0.60, 0.70); // Bent knee
      setKeypoint(KEYPOINT_INDICES.leftAnkle, 0.75, 0.42, 0.60); // Lower confidence
      setKeypoint(KEYPOINT_INDICES.rightAnkle, 0.75, 0.58, 0.60); // Lower confidence
      break;
    }
    
    case 'partial': {
      // Person with some occluded parts
      // Head keypoints (visible)
      setKeypoint(KEYPOINT_INDICES.nose, 0.18, 0.5, 0.88);
      setKeypoint(KEYPOINT_INDICES.leftEye, 0.15, 0.48, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightEye, 0.15, 0.52, 0.85);
      setKeypoint(KEYPOINT_INDICES.leftEar, 0.18, 0.45, 0.75);
      setKeypoint(KEYPOINT_INDICES.rightEar, 0.18, 0.55, 0.10); // Occluded
      
      // Upper body keypoints (mostly visible)
      setKeypoint(KEYPOINT_INDICES.leftShoulder, 0.28, 0.42, 0.90);
      setKeypoint(KEYPOINT_INDICES.rightShoulder, 0.28, 0.58, 0.85);
      setKeypoint(KEYPOINT_INDICES.leftElbow, 0.38, 0.38, 0.80);
      setKeypoint(KEYPOINT_INDICES.rightElbow, 0.38, 0.62, 0.15); // Occluded
      setKeypoint(KEYPOINT_INDICES.leftWrist, 0.48, 0.35, 0.70);
      setKeypoint(KEYPOINT_INDICES.rightWrist, 0.48, 0.65, 0.05); // Occluded
      
      // Lower body keypoints (partially visible)
      setKeypoint(KEYPOINT_INDICES.leftHip, 0.58, 0.45, 0.80);
      setKeypoint(KEYPOINT_INDICES.rightHip, 0.58, 0.55, 0.75);
      setKeypoint(KEYPOINT_INDICES.leftKnee, 0.72, 0.46, 0.65);
      setKeypoint(KEYPOINT_INDICES.rightKnee, 0.72, 0.54, 0.25); // Occluded
      setKeypoint(KEYPOINT_INDICES.leftAnkle, 0.86, 0.47, 0.50);
      setKeypoint(KEYPOINT_INDICES.rightAnkle, 0.86, 0.53, 0.08); // Occluded
      break;
    }
    
    case 'low_confidence': {
      // Person detected but with low confidence (poor lighting, motion blur, etc.)
      // Head keypoints
      setKeypoint(KEYPOINT_INDICES.nose, 0.16, 0.5, 0.45);
      setKeypoint(KEYPOINT_INDICES.leftEye, 0.13, 0.48, 0.40);
      setKeypoint(KEYPOINT_INDICES.rightEye, 0.13, 0.52, 0.42);
      setKeypoint(KEYPOINT_INDICES.leftEar, 0.16, 0.45, 0.35);
      setKeypoint(KEYPOINT_INDICES.rightEar, 0.16, 0.55, 0.38);
      
      // Upper body keypoints
      setKeypoint(KEYPOINT_INDICES.leftShoulder, 0.26, 0.42, 0.50);
      setKeypoint(KEYPOINT_INDICES.rightShoulder, 0.26, 0.58, 0.48);
      setKeypoint(KEYPOINT_INDICES.leftElbow, 0.36, 0.38, 0.35);
      setKeypoint(KEYPOINT_INDICES.rightElbow, 0.36, 0.62, 0.32);
      setKeypoint(KEYPOINT_INDICES.leftWrist, 0.46, 0.35, 0.28);
      setKeypoint(KEYPOINT_INDICES.rightWrist, 0.46, 0.65, 0.30);
      
      // Lower body keypoints
      setKeypoint(KEYPOINT_INDICES.leftHip, 0.56, 0.45, 0.45);
      setKeypoint(KEYPOINT_INDICES.rightHip, 0.56, 0.55, 0.43);
      setKeypoint(KEYPOINT_INDICES.leftKnee, 0.71, 0.46, 0.25);
      setKeypoint(KEYPOINT_INDICES.rightKnee, 0.71, 0.54, 0.22);
      setKeypoint(KEYPOINT_INDICES.leftAnkle, 0.86, 0.47, 0.18);
      setKeypoint(KEYPOINT_INDICES.rightAnkle, 0.86, 0.53, 0.20);
      break;
    }
    
    default: {
      // Default to standing pose
      setKeypoint(KEYPOINT_INDICES.nose, 0.15, 0.5, 0.95);
      setKeypoint(KEYPOINT_INDICES.leftEye, 0.12, 0.48, 0.90);
      setKeypoint(KEYPOINT_INDICES.rightEye, 0.12, 0.52, 0.90);
      setKeypoint(KEYPOINT_INDICES.leftEar, 0.15, 0.45, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightEar, 0.15, 0.55, 0.85);
      setKeypoint(KEYPOINT_INDICES.leftShoulder, 0.25, 0.42, 0.95);
      setKeypoint(KEYPOINT_INDICES.rightShoulder, 0.25, 0.58, 0.95);
      setKeypoint(KEYPOINT_INDICES.leftElbow, 0.35, 0.38, 0.90);
      setKeypoint(KEYPOINT_INDICES.rightElbow, 0.35, 0.62, 0.90);
      setKeypoint(KEYPOINT_INDICES.leftWrist, 0.45, 0.35, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightWrist, 0.45, 0.65, 0.85);
      setKeypoint(KEYPOINT_INDICES.leftHip, 0.55, 0.45, 0.92);
      setKeypoint(KEYPOINT_INDICES.rightHip, 0.55, 0.55, 0.92);
      setKeypoint(KEYPOINT_INDICES.leftKnee, 0.70, 0.46, 0.88);
      setKeypoint(KEYPOINT_INDICES.rightKnee, 0.70, 0.54, 0.88);
      setKeypoint(KEYPOINT_INDICES.leftAnkle, 0.85, 0.47, 0.85);
      setKeypoint(KEYPOINT_INDICES.rightAnkle, 0.85, 0.53, 0.85);
      break;
    }
  }
  
  return output;
}


/**
 * Get a human-readable description of the mock pose
 */
export function getMockPoseDescription(scenario: 'standing' | 'sitting' | 'partial' | 'low_confidence'): string {
  'worklet';
  
  switch (scenario) {
    case 'standing':
      return 'Standing person facing camera with high confidence on all keypoints';
    case 'sitting':
      return 'Sitting person with bent knees and medium confidence';
    case 'partial':
      return 'Person with some occluded keypoints (right side partially hidden)';
    case 'low_confidence':
      return 'Person detected with generally low confidence scores';
    default:
      return 'Unknown pose scenario';
  }
}

/**
 * Test all mock scenarios
 */
export function getAllMockScenarios(): Array<{
  name: string;
  scenario: 'standing' | 'sitting' | 'partial' | 'low_confidence';
  description: string;
  output: Float32Array;
}> {
  'worklet';
  
  const scenarios: Array<'standing' | 'sitting' | 'partial' | 'low_confidence'> = 
    ['standing', 'sitting', 'partial', 'low_confidence'];
  
  return scenarios.map(scenario => ({
    name: scenario,
    scenario,
    description: getMockPoseDescription(scenario),
    output: generateMockMoveNetOutput(scenario),
  }));
}