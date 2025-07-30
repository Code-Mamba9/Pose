import type { Frame } from 'react-native-vision-camera';

/**
 * Individual keypoint with coordinates and confidence
 */
export interface Keypoint {
  x: number;        // Normalized x coordinate (0.0 to 1.0)
  y: number;        // Normalized y coordinate (0.0 to 1.0)
  confidence: number; // Confidence score (0.0 to 1.0)
}

/**
 * Screen coordinates for a keypoint
 */
export interface ScreenKeypoint {
  x: number;        // Screen pixel x coordinate
  y: number;        // Screen pixel y coordinate
  confidence: number; // Confidence score (0.0 to 1.0)
}

/**
 * Complete pose data with all 17 keypoints
 */
export interface PoseKeypoints {
  // Face keypoints
  nose: Keypoint;
  leftEye: Keypoint;
  rightEye: Keypoint;
  leftEar: Keypoint;
  rightEar: Keypoint;
  
  // Upper body keypoints
  leftShoulder: Keypoint;
  rightShoulder: Keypoint;
  leftElbow: Keypoint;
  rightElbow: Keypoint;
  leftWrist: Keypoint;
  rightWrist: Keypoint;
  
  // Lower body keypoints
  leftHip: Keypoint;
  rightHip: Keypoint;
  leftKnee: Keypoint;
  rightKnee: Keypoint;
  leftAnkle: Keypoint;
  rightAnkle: Keypoint;
}

/**
 * Screen-coordinate version of pose keypoints
 */
export interface ScreenPoseKeypoints {
  // Face keypoints
  nose: ScreenKeypoint;
  leftEye: ScreenKeypoint;
  rightEye: ScreenKeypoint;
  leftEar: ScreenKeypoint;
  rightEar: ScreenKeypoint;
  
  // Upper body keypoints
  leftShoulder: ScreenKeypoint;
  rightShoulder: ScreenKeypoint;
  leftElbow: ScreenKeypoint;
  rightElbow: ScreenKeypoint;
  leftWrist: ScreenKeypoint;
  rightWrist: ScreenKeypoint;
  
  // Lower body keypoints
  leftHip: ScreenKeypoint;
  rightHip: ScreenKeypoint;
  leftKnee: ScreenKeypoint;
  rightKnee: ScreenKeypoint;
  leftAnkle: ScreenKeypoint;
  rightAnkle: ScreenKeypoint;
}

/**
 * Complete pose detection result
 */
export interface PoseDetectionResult {
  keypoints: PoseKeypoints;
  screenKeypoints: ScreenPoseKeypoints;
  overallConfidence: number;
  validKeypoints: number;
  processingTime: number;
  frameWidth: number;
  frameHeight: number;
}

/**
 * Configuration for keypoint extraction
 */
export interface KeypointExtractionConfig {
  confidenceThreshold: number;  // Minimum confidence to consider a keypoint valid
  screenWidth: number;         // Target screen width for coordinate conversion
  screenHeight: number;        // Target screen height for coordinate conversion
}

/**
 * Default configuration for MoveNet keypoint extraction
 */
export const DEFAULT_KEYPOINT_CONFIG: KeypointExtractionConfig = {
  confidenceThreshold: 0.3, // 30% confidence threshold
  screenWidth: 192,  // Will be overridden with actual screen dimensions
  screenHeight: 192, // Will be overridden with actual screen dimensions
};

/**
 * MoveNet keypoint mapping - maps keypoint names to tensor indices
 * Based on MoveNet's 17-keypoint model output
 */
export const KEYPOINT_INDICES = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
} as const;

/**
 * Skeleton connections for pose visualization
 * Each tuple represents a connection between two keypoint indices
 */
export const POSE_CONNECTIONS = [
  // Face connections
  [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.leftEye],
  [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.rightEye],
  [KEYPOINT_INDICES.leftEye, KEYPOINT_INDICES.leftEar],
  [KEYPOINT_INDICES.rightEye, KEYPOINT_INDICES.rightEar],
  
  // Upper body connections
  [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.leftShoulder],
  [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.rightShoulder],
  [KEYPOINT_INDICES.leftShoulder, KEYPOINT_INDICES.leftElbow],
  [KEYPOINT_INDICES.leftElbow, KEYPOINT_INDICES.leftWrist],
  [KEYPOINT_INDICES.rightShoulder, KEYPOINT_INDICES.rightElbow],
  [KEYPOINT_INDICES.rightElbow, KEYPOINT_INDICES.rightWrist],
  [KEYPOINT_INDICES.leftShoulder, KEYPOINT_INDICES.rightShoulder],
  
  // Torso connections
  [KEYPOINT_INDICES.leftShoulder, KEYPOINT_INDICES.leftHip],
  [KEYPOINT_INDICES.rightShoulder, KEYPOINT_INDICES.rightHip],
  [KEYPOINT_INDICES.leftHip, KEYPOINT_INDICES.rightHip],
  
  // Lower body connections
  [KEYPOINT_INDICES.leftHip, KEYPOINT_INDICES.leftKnee],
  [KEYPOINT_INDICES.leftKnee, KEYPOINT_INDICES.leftAnkle],
  [KEYPOINT_INDICES.rightHip, KEYPOINT_INDICES.rightKnee],
  [KEYPOINT_INDICES.rightKnee, KEYPOINT_INDICES.rightAnkle],
] as const;

/**
 * Extract individual keypoint from MoveNet output tensor
 */
function extractKeypoint(
  outputTensor: Float32Array,
  keypointIndex: number
): Keypoint {
  'worklet';
  
  // MoveNet output format: [batch, person, keypoint, [y, x, confidence]]
  // For single person detection: tensor shape is flattened to [1 * 1 * 17 * 3] = [51]
  const baseIndex = keypointIndex * 3;
  
  // Bounds checking
  if (baseIndex + 2 >= outputTensor.length) {
    console.warn(`Keypoint index ${keypointIndex} out of bounds for tensor length ${outputTensor.length}`);
    return { x: 0, y: 0, confidence: 0 };
  }
  
  const y = outputTensor[baseIndex];     // Y coordinate (normalized)
  const x = outputTensor[baseIndex + 1]; // X coordinate (normalized)  
  const confidence = outputTensor[baseIndex + 2]; // Confidence score
  
  // Clamp values to valid ranges
  return {
    x: Math.max(0, Math.min(1, x || 0)),
    y: Math.max(0, Math.min(1, y || 0)),
    confidence: Math.max(0, Math.min(1, confidence || 0)),
  };
}

/**
 * Convert normalized keypoint to screen coordinates
 */
function keypointToScreen(
  keypoint: Keypoint,
  screenWidth: number,
  screenHeight: number
): ScreenKeypoint {
  'worklet';
  
  return {
    x: keypoint.x * screenWidth,
    y: keypoint.y * screenHeight,
    confidence: keypoint.confidence,
  };
}

/**
 * Calculate overall pose confidence based on key torso and limb keypoints
 */
function calculateOverallConfidence(keypoints: PoseKeypoints): number {
  'worklet';
  
  // Key keypoints for overall pose assessment
  const keyKeypointNames: (keyof PoseKeypoints)[] = [
    'nose', 'leftShoulder', 'rightShoulder', 
    'leftHip', 'rightHip', 'leftKnee', 'rightKnee'
  ];
  
  let totalConfidence = 0;
  let validKeypoints = 0;
  
  for (const name of keyKeypointNames) {
    const keypoint = keypoints[name];
    if (keypoint.confidence > 0.1) { // Very low threshold for counting
      totalConfidence += keypoint.confidence;
      validKeypoints++;
    }
  }
  
  return validKeypoints > 0 ? totalConfidence / validKeypoints : 0;
}

/**
 * Count valid keypoints above confidence threshold
 */
function countValidKeypoints(
  keypoints: PoseKeypoints,
  threshold: number
): number {
  'worklet';
  
  let count = 0;
  const keypointValues = Object.values(keypoints);
  
  for (const keypoint of keypointValues) {
    if (keypoint.confidence >= threshold) {
      count++;
    }
  }
  
  return count;
}

/**
 * Main function to extract pose keypoints from MoveNet model output
 */
export function extractPoseKeypoints(
  modelOutput: Float32Array,
  config: KeypointExtractionConfig = DEFAULT_KEYPOINT_CONFIG
): PoseDetectionResult {
  'worklet';
  
  const startTime = Date.now();
  
  try {
    
    // Validate tensor shape
    if (modelOutput.length !== 51) {
      throw new Error(`Invalid MoveNet output shape. Expected 51 values (1*1*17*3), got ${modelOutput.length}`);
    }
    
    // Extract all 17 keypoints
    const keypoints: PoseKeypoints = {
      nose: extractKeypoint(modelOutput, KEYPOINT_INDICES.nose),
      leftEye: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftEye),
      rightEye: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightEye),
      leftEar: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftEar),
      rightEar: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightEar),
      leftShoulder: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftShoulder),
      rightShoulder: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightShoulder),
      leftElbow: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftElbow),
      rightElbow: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightElbow),
      leftWrist: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftWrist),
      rightWrist: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightWrist),
      leftHip: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftHip),
      rightHip: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightHip),
      leftKnee: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftKnee),
      rightKnee: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightKnee),
      leftAnkle: extractKeypoint(modelOutput, KEYPOINT_INDICES.leftAnkle),
      rightAnkle: extractKeypoint(modelOutput, KEYPOINT_INDICES.rightAnkle),
    };
    
    // Convert to screen coordinates
    const screenKeypoints: ScreenPoseKeypoints = {
      nose: keypointToScreen(keypoints.nose, config.screenWidth, config.screenHeight),
      leftEye: keypointToScreen(keypoints.leftEye, config.screenWidth, config.screenHeight),
      rightEye: keypointToScreen(keypoints.rightEye, config.screenWidth, config.screenHeight),
      leftEar: keypointToScreen(keypoints.leftEar, config.screenWidth, config.screenHeight),
      rightEar: keypointToScreen(keypoints.rightEar, config.screenWidth, config.screenHeight),
      leftShoulder: keypointToScreen(keypoints.leftShoulder, config.screenWidth, config.screenHeight),
      rightShoulder: keypointToScreen(keypoints.rightShoulder, config.screenWidth, config.screenHeight),
      leftElbow: keypointToScreen(keypoints.leftElbow, config.screenWidth, config.screenHeight),
      rightElbow: keypointToScreen(keypoints.rightElbow, config.screenWidth, config.screenHeight),
      leftWrist: keypointToScreen(keypoints.leftWrist, config.screenWidth, config.screenHeight),
      rightWrist: keypointToScreen(keypoints.rightWrist, config.screenWidth, config.screenHeight),
      leftHip: keypointToScreen(keypoints.leftHip, config.screenWidth, config.screenHeight),
      rightHip: keypointToScreen(keypoints.rightHip, config.screenWidth, config.screenHeight),
      leftKnee: keypointToScreen(keypoints.leftKnee, config.screenWidth, config.screenHeight),
      rightKnee: keypointToScreen(keypoints.rightKnee, config.screenWidth, config.screenHeight),
      leftAnkle: keypointToScreen(keypoints.leftAnkle, config.screenWidth, config.screenHeight),
      rightAnkle: keypointToScreen(keypoints.rightAnkle, config.screenWidth, config.screenHeight),
    };
    
    // Calculate confidence metrics
    const overallConfidence = calculateOverallConfidence(keypoints);
    const validKeypoints = countValidKeypoints(keypoints, config.confidenceThreshold);
    
    const processingTime = Date.now() - startTime;
    
    
    // Log all keypoints for debugging
    console.log('All keypoints:', {
      nose: `(${keypoints.nose.x.toFixed(3)}, ${keypoints.nose.y.toFixed(3)}) conf: ${keypoints.nose.confidence.toFixed(3)}`,
      leftEye: `(${keypoints.leftEye.x.toFixed(3)}, ${keypoints.leftEye.y.toFixed(3)}) conf: ${keypoints.leftEye.confidence.toFixed(3)}`,
      rightEye: `(${keypoints.rightEye.x.toFixed(3)}, ${keypoints.rightEye.y.toFixed(3)}) conf: ${keypoints.rightEye.confidence.toFixed(3)}`,
      leftEar: `(${keypoints.leftEar.x.toFixed(3)}, ${keypoints.leftEar.y.toFixed(3)}) conf: ${keypoints.leftEar.confidence.toFixed(3)}`,
      rightEar: `(${keypoints.rightEar.x.toFixed(3)}, ${keypoints.rightEar.y.toFixed(3)}) conf: ${keypoints.rightEar.confidence.toFixed(3)}`,
      leftShoulder: `(${keypoints.leftShoulder.x.toFixed(3)}, ${keypoints.leftShoulder.y.toFixed(3)}) conf: ${keypoints.leftShoulder.confidence.toFixed(3)}`,
      rightShoulder: `(${keypoints.rightShoulder.x.toFixed(3)}, ${keypoints.rightShoulder.y.toFixed(3)}) conf: ${keypoints.rightShoulder.confidence.toFixed(3)}`,
      leftElbow: `(${keypoints.leftElbow.x.toFixed(3)}, ${keypoints.leftElbow.y.toFixed(3)}) conf: ${keypoints.leftElbow.confidence.toFixed(3)}`,
      rightElbow: `(${keypoints.rightElbow.x.toFixed(3)}, ${keypoints.rightElbow.y.toFixed(3)}) conf: ${keypoints.rightElbow.confidence.toFixed(3)}`,
      leftWrist: `(${keypoints.leftWrist.x.toFixed(3)}, ${keypoints.leftWrist.y.toFixed(3)}) conf: ${keypoints.leftWrist.confidence.toFixed(3)}`,
      rightWrist: `(${keypoints.rightWrist.x.toFixed(3)}, ${keypoints.rightWrist.y.toFixed(3)}) conf: ${keypoints.rightWrist.confidence.toFixed(3)}`,
      leftHip: `(${keypoints.leftHip.x.toFixed(3)}, ${keypoints.leftHip.y.toFixed(3)}) conf: ${keypoints.leftHip.confidence.toFixed(3)}`,
      rightHip: `(${keypoints.rightHip.x.toFixed(3)}, ${keypoints.rightHip.y.toFixed(3)}) conf: ${keypoints.rightHip.confidence.toFixed(3)}`,
      leftKnee: `(${keypoints.leftKnee.x.toFixed(3)}, ${keypoints.leftKnee.y.toFixed(3)}) conf: ${keypoints.leftKnee.confidence.toFixed(3)}`,
      rightKnee: `(${keypoints.rightKnee.x.toFixed(3)}, ${keypoints.rightKnee.y.toFixed(3)}) conf: ${keypoints.rightKnee.confidence.toFixed(3)}`,
      leftAnkle: `(${keypoints.leftAnkle.x.toFixed(3)}, ${keypoints.leftAnkle.y.toFixed(3)}) conf: ${keypoints.leftAnkle.confidence.toFixed(3)}`,
      rightAnkle: `(${keypoints.rightAnkle.x.toFixed(3)}, ${keypoints.rightAnkle.y.toFixed(3)}) conf: ${keypoints.rightAnkle.confidence.toFixed(3)}`
    });
    
    return {
      keypoints,
      screenKeypoints,
      overallConfidence,
      validKeypoints,
      processingTime,
      frameWidth: config.screenWidth,
      frameHeight: config.screenHeight,
    };
    
  } catch (error) {
    console.error('Keypoint extraction failed - detailed error:', {
      error: error,
      errorType: Object.prototype.toString.call(error),
      message: error instanceof Error ? error.message : 'No message',
      stack: error instanceof Error ? error.stack : 'No stack',
      name: error instanceof Error ? error.name : 'No name'
    });
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Keypoint extraction error: ${errorMessage}`);
  }
}

/**
 * Filter keypoints by confidence threshold
 */
export function filterKeypointsByConfidence(
  keypoints: PoseKeypoints,
  threshold: number
): Partial<PoseKeypoints> {
  'worklet';
  
  const filtered: Partial<PoseKeypoints> = {};
  
  for (const [name, keypoint] of Object.entries(keypoints)) {
    if (keypoint.confidence >= threshold) {
      (filtered as any)[name] = keypoint;
    }
  }
  
  return filtered;
}

/**
 * Get keypoints above confidence threshold for visualization
 */
export function getHighConfidenceKeypoints(
  result: PoseDetectionResult,
  threshold: number = 0.5
): Array<{name: string, keypoint: ScreenKeypoint}> {
  'worklet';
  
  const highConfidenceKeypoints: Array<{name: string, keypoint: ScreenKeypoint}> = [];
  
  for (const [name, keypoint] of Object.entries(result.screenKeypoints)) {
    if (keypoint.confidence >= threshold) {
      highConfidenceKeypoints.push({ name, keypoint });
    }
  }
  
  return highConfidenceKeypoints;
}

/**
 * Get skeleton connections for visualization based on confidence
 */
export function getValidConnections(
  result: PoseDetectionResult,
  threshold: number = 0.5
): Array<{start: ScreenKeypoint, end: ScreenKeypoint}> {
  'worklet';
  
  const validConnections: Array<{start: ScreenKeypoint, end: ScreenKeypoint}> = [];
  const keypointNames = Object.keys(KEYPOINT_INDICES) as (keyof typeof KEYPOINT_INDICES)[];
  
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    // Find keypoint names by index
    const startName = keypointNames.find(name => KEYPOINT_INDICES[name] === startIdx);
    const endName = keypointNames.find(name => KEYPOINT_INDICES[name] === endIdx);
    
    if (startName && endName) {
      const startKeypoint = result.screenKeypoints[startName];
      const endKeypoint = result.screenKeypoints[endName];
      
      // Only include connection if both keypoints have sufficient confidence
      if (startKeypoint.confidence >= threshold && endKeypoint.confidence >= threshold) {
        validConnections.push({
          start: startKeypoint,
          end: endKeypoint
        });
      }
    }
  }
  
  return validConnections;
}