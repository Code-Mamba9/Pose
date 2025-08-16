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
  // [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.leftEye],
  // [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.rightEye],
  // [KEYPOINT_INDICES.leftEye, KEYPOINT_INDICES.leftEar],
  // [KEYPOINT_INDICES.rightEye, KEYPOINT_INDICES.rightEar],

  // Upper body connections
  // [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.leftShoulder],
  // [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.rightShoulder],
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

