// 🚨 MOCK POSE DETECTION SERVICE - NOT REAL AI/ML 🚨
// 
// This service provides SIMULATED pose detection for testing camera integration
// All keypoints, confidence scores, and pose data are FAKE/RANDOM
// 
// This is NOT analyzing camera frames for actual human poses
// This is NOT using TensorFlow Lite or any ML model
// This is NOT detecting real body parts or movements
// 
// Purpose: Test the camera → frame processor → UI pipeline with fake data
// 
// TODO: Replace with actual TensorFlow Lite MoveNet integration for real pose detection

import type { PoseDetection } from '@/types';
import { Frame } from 'react-native-vision-camera';

interface PoseKeypoint {
  x: number;
  y: number;
  confidence: number;
  name: string;
}

interface ProcessedFrame {
  width: number;
  height: number;
  pixelFormat: string;
  timestamp: number;
  keypoints: PoseKeypoint[];
  confidence: number;
  processingTime: number;
}

export class PoseDetectionService {
  private static isInitialized = false;
  private static keypointNames = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
  ];

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🧠 [PoseDetectionService] Initializing pose detection service...');
    
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.isInitialized = true;
    console.log('✅ [PoseDetectionService] Service initialized successfully');
  }

  static async processFrame(frame: Frame): Promise<ProcessedFrame | null> {
    if (!this.isInitialized) {
      console.warn('⚠️ [PoseDetectionService] Service not initialized');
      return null;
    }

    const startTime = Date.now();

    try {
      // Validate frame dimensions
      if (frame.width < 480 || frame.height < 480) {
        console.log(`[PoseDetectionService] Frame too small: ${frame.width}x${frame.height}`);
        return null;
      }

      // Generate simulated keypoints with realistic positions
      // This simulates the output structure that TensorFlow Lite MoveNet would provide
      const keypoints: PoseKeypoint[] = this.keypointNames.map((name, index) => {
        // Create more realistic pose positions
        let x: number, y: number, confidence: number;
        
        switch (name) {
          case 'nose':
            x = frame.width * 0.5;
            y = frame.height * 0.2;
            confidence = 0.9 + Math.random() * 0.1;
            break;
          case 'left_shoulder':
          case 'right_shoulder':
            x = frame.width * (name.includes('left') ? 0.4 : 0.6);
            y = frame.height * 0.35;
            confidence = 0.8 + Math.random() * 0.2;
            break;
          case 'left_hip':
          case 'right_hip':
            x = frame.width * (name.includes('left') ? 0.45 : 0.55);
            y = frame.height * 0.65;
            confidence = 0.7 + Math.random() * 0.3;
            break;
          default:
            // Other keypoints with some randomness
            x = Math.random() * frame.width;
            y = Math.random() * frame.height;
            confidence = Math.random() * 0.5 + 0.5; // 0.5-1.0
        }

        return {
          x: Math.max(0, Math.min(frame.width, x + (Math.random() - 0.5) * 50)),
          y: Math.max(0, Math.min(frame.height, y + (Math.random() - 0.5) * 50)),
          confidence: Math.max(0.1, Math.min(1.0, confidence + (Math.random() - 0.5) * 0.2)),
          name
        };
      });

      // Calculate overall pose confidence (average of keypoint confidences)
      const overallConfidence = keypoints.reduce((sum, kp) => sum + kp.confidence, 0) / keypoints.length;
      
      const processingTime = Date.now() - startTime;

      const result: ProcessedFrame = {
        width: frame.width,
        height: frame.height,
        pixelFormat: frame.pixelFormat,
        timestamp: frame.timestamp,
        keypoints,
        confidence: overallConfidence,
        processingTime
      };

      // Log every 30th frame to avoid spam
      if (Math.random() < 0.033) { // ~1 in 30 frames
        console.log(`🔍 [PoseDetectionService] Detected pose: ${keypoints.length} keypoints, ${(overallConfidence * 100).toFixed(1)}% confidence, ${processingTime}ms`);
      }

      return result;

    } catch (error) {
      console.error('❌ [PoseDetectionService] Error processing frame:', error);
      return null;
    }
  }

  static async detectPose(frameData: any): Promise<PoseDetection | null> {
    // Legacy method for compatibility
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Convert legacy frameData to simulated pose detection result
    const mockPose: PoseDetection = {
      keypoints: this.keypointNames.map((name, index) => ({
        x: Math.random() * (frameData?.width || 640),
        y: Math.random() * (frameData?.height || 480),
        confidence: Math.random() * 0.5 + 0.5,
        name
      })),
      confidence: Math.random() * 0.3 + 0.7,
      timestamp: Date.now()
    };

    return mockPose;
  }

  static getKeypointNames(): string[] {
    return [...this.keypointNames];
  }

  static isServiceReady(): boolean {
    return this.isInitialized;
  }

  static async dispose(): Promise<void> {
    console.log('🧹 [PoseDetectionService] Disposing service...');
    this.isInitialized = false;
  }
}