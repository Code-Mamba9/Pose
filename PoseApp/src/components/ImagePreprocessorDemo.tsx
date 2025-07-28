import React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useFrameProcessor, type Frame, type CameraDevice } from 'react-native-vision-camera';
import { preprocessFrame, MOVENET_PREPROCESSING_CONFIG } from '../services/ImagePreprocessorFunctions';
import { preprocessFrameOptimized } from '../services/ImagePreprocessorOptimized';
import { processPoseDetection, DEFAULT_PIPELINE_CONFIG, type PoseDetectionConfig } from '../services/PoseDetectionPipeline';

interface ImagePreprocessorDemoProps {
  useFallback?: boolean; // Option to test fallback processing
  useOptimized?: boolean; // Option to test optimized version
  device: CameraDevice;
  enablePoseDetection?: boolean; // New option to test full pipeline
  mockScenario?: 'standing' | 'sitting' | 'partial' | 'low_confidence';
}

/**
 * Demo component showing fallback preprocessing approach
 * Uses native JavaScript implementation instead of resize plugin
 */
export const ImagePreprocessorDemo: React.FC<ImagePreprocessorDemoProps> = ({ 
  useFallback = true, // Default to fallback since plugin may not be available
  useOptimized = true, // Default to optimized version for better performance
  device,
  enablePoseDetection = false, // New option to test complete pipeline
  mockScenario = 'standing' // Default mock scenario
}) => {
  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    
    try {
      if (enablePoseDetection) {
        // Test the complete pose detection pipeline
        console.log('=== Testing Complete Pose Detection Pipeline ===');
        
        const pipelineConfig: PoseDetectionConfig = {
          ...DEFAULT_PIPELINE_CONFIG,
          useOptimizedPreprocessing: useOptimized,
          enableMockMode: true, // Use mock inference for testing
          mockScenario: mockScenario,
          keypointConfig: {
            ...DEFAULT_PIPELINE_CONFIG.keypointConfig,
            screenWidth: frame.width,
            screenHeight: frame.height,
          }
        };
        
        const pipelineResult = processPoseDetection(frame, pipelineConfig);
        
        if (pipelineResult.success) {
          console.log('=== Pipeline Success ===');
          console.log('Performance:', {
            totalTime: `${pipelineResult.totalProcessingTime}ms`,
            preprocessing: `${pipelineResult.preprocessing.processingTime}ms`,
            keypoints: `${pipelineResult.poseDetection.processingTime}ms`,
            fps: (1000 / pipelineResult.totalProcessingTime).toFixed(1)
          });
          
          console.log('Pose detection:', {
            confidence: `${(pipelineResult.poseDetection.overallConfidence * 100).toFixed(1)}%`,
            validKeypoints: `${pipelineResult.poseDetection.validKeypoints}/17`,
            scenario: mockScenario
          });
          
          // Log a few key keypoints for verification
          const { keypoints } = pipelineResult.poseDetection;
          console.log('Key keypoints:', {
            nose: `(${keypoints.nose.x.toFixed(3)}, ${keypoints.nose.y.toFixed(3)}) conf: ${keypoints.nose.confidence.toFixed(3)}`,
            leftShoulder: `(${keypoints.leftShoulder.x.toFixed(3)}, ${keypoints.leftShoulder.y.toFixed(3)}) conf: ${keypoints.leftShoulder.confidence.toFixed(3)}`,
            rightShoulder: `(${keypoints.rightShoulder.x.toFixed(3)}, ${keypoints.rightShoulder.y.toFixed(3)}) conf: ${keypoints.rightShoulder.confidence.toFixed(3)}`
          });
        } else {
          console.error('Pipeline failed:', pipelineResult.error);
        }
        
      } else {
        // Original preprocessing-only testing
        console.log('=== Frame Processor Start (Preprocessing Only) ===');
        console.log('Frame properties:', {
          width: frame.width,
          height: frame.height,
          pixelFormat: frame.pixelFormat,
          orientation: frame.orientation
        });
        
        // Test frame.toArrayBuffer() directly
        console.log('Testing frame.toArrayBuffer()...');
        const testBuffer = frame.toArrayBuffer();
        console.log('Buffer test result:', {
          bufferExists: !!testBuffer,
          bufferLength: testBuffer?.byteLength || 0
        });
        
        if (!testBuffer) {
          throw new Error('frame.toArrayBuffer() returned null/undefined');
        }
        
        // Preprocess the frame for MoveNet using optimized or standard approach
        console.log(`Calling ${useOptimized ? 'optimized' : 'standard'} preprocessFrame function...`);
        const result = useOptimized 
          ? preprocessFrameOptimized(frame, MOVENET_PREPROCESSING_CONFIG)
          : preprocessFrame(frame, MOVENET_PREPROCESSING_CONFIG);
        
        console.log('Preprocessing completed:', {
          width: result.width,
          height: result.height,
          channels: result.channels,
          dataType: result.data.constructor.name,
          dataLength: result.data.length,
          processingTime: result.processingTime
        });
      }
      
    } catch (error) {
      console.error('Frame processing error:');
      console.error('Error message:', error?.message || 'No message');
      console.error('Error name:', error?.name || 'No name');
      console.error('Error stack:', error?.stack || 'No stack');
      console.error('Full error object:', error);
    }
  }, [enablePoseDetection, useOptimized, mockScenario]);

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      pixelFormat='yuv' // Use YUV for optimal performance with fallback processing
    />
  );
};

const styles = StyleSheet.create({
  // Add any styles if needed
});