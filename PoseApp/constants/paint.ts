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
 * Keypoint type definition
 */
export interface Keypoint {
  x: number;
  y: number;
  confidence: number;
}
