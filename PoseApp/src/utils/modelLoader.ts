import { ModelManager, ModelConfig } from '../services/ModelManager';

/**
 * MoveNet Lightning model configuration for pose detection
 * Model specs:
 * - Input: [1, 192, 192, 3] (RGB image)  
 * - Output: [1, 1, 17, 3] (17 keypoints with y, x, confidence)
 * - Keypoints: nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles
 */
export const MOVENET_CONFIG: ModelConfig = {
  modelPath: require('../../assets/models/movenet_lightning_f16.tflite'),
  enableGPU: true,
  inputSize: 192,
  outputShape: [1, 1, 17, 3],
};

/**
 * Create and initialize a MoveNet model manager
 * @deprecated Use ModelManager directly or useModelManager hook instead
 */
export async function loadMoveNetModel(): Promise<ModelManager> {
  const modelManager = new ModelManager();
  await modelManager.initialize(MOVENET_CONFIG);
  return modelManager;
}

/**
 * MoveNet keypoint indices mapping
 * Output format: [y_coordinate, x_coordinate, confidence_score]
 * Coordinates are normalized (0.0 to 1.0)
 */
export const KEYPOINT_INDICES = {
  nose: 0,
  left_eye: 1,
  right_eye: 2,
  left_ear: 3,
  right_ear: 4,
  left_shoulder: 5,
  right_shoulder: 6,
  left_elbow: 7,
  right_elbow: 8,
  left_wrist: 9,
  right_wrist: 10,
  left_hip: 11,
  right_hip: 12,
  left_knee: 13,
  right_knee: 14,
  left_ankle: 15,
  right_ankle: 16,
} as const;

export type KeypointName = keyof typeof KEYPOINT_INDICES;

/**
 * Default confidence threshold for keypoint visibility
 * Keypoints with confidence below this threshold should be considered unreliable
 */
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.11;