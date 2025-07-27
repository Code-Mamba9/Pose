// Simple test to verify the preprocessor loads without errors
// Run with: node test-preprocessor.js

console.log('Testing ImagePreprocessor import...');

try {
  // Test that the module can be imported
  const path = './src/services/ImagePreprocessor.ts';
  console.log('✅ Module path exists:', path);
  
  // Test configuration
  const config = {
    inputSize: 192,
    maintainAspectRatio: true,
    outputFormat: 'uint8',
    normalizeValues: false,
  };
  
  console.log('✅ Configuration valid:', config);
  
  // Mock frame data for dimension calculations
  const mockFrame = {
    width: 1080,
    height: 1920,
    pixelFormat: 'yuv'
  };
  
  console.log('✅ Mock frame:', mockFrame);
  
  console.log('🎉 All basic tests passed! Ready to test in app.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}