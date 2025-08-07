import React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useFrameProcessor, type Frame, type CameraDevice } from 'react-native-vision-camera';
import { preprocessFrame, MOVENET_PREPROCESSING_CONFIG } from '../services/ImagePreprocessor';
import { processPoseDetection, DEFAULT_PIPELINE_CONFIG, type PoseDetectionConfig } from '../services/PoseDetectionPipeline';

interface ImagePreprocessorDemoProps {
  device: CameraDevice;
  enablePoseDetection?: boolean; // Option to test full pipeline
  mockScenario?: 'standing' | 'sitting' | 'partial' | 'low_confidence';
}

/**
 * Demo component showing optimized preprocessing functions usage
 * Uses software fallback with optimized algorithms (hardware acceleration available via processWithResizePlugin)
 */
export const ImagePreprocessorDemo: React.FC<ImagePreprocessorDemoProps> = ({ 
  device,
  enablePoseDetection = false, // Option to test complete pipeline
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
        
        // Preprocess the frame for MoveNet using optimized preprocessing functions
        console.log('Calling preprocessFrame...');
        const result = preprocessFrame(frame, MOVENET_PREPROCESSING_CONFIG);
        
        console.log('Preprocessing completed:', {
          width: result.width,
          height: result.height,
          channels: result.channels,
          dataType: result.data?.constructor?.name || 'Unknown',
          dataLength: result.data.length,
          processingTime: result.processingTime
        });
      }
      
    } catch (error) {
      console.error('Frame processing error:');
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error:', error);
      }
      console.error('Full error object:', error);
    }
  }, [enablePoseDetection, mockScenario]);

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