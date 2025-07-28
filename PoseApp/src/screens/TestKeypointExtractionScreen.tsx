import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { 
  extractPoseKeypoints, 
  DEFAULT_KEYPOINT_CONFIG,
  type PoseDetectionResult,
  type KeypointExtractionConfig 
} from '../services/KeypointExtractor';
import { 
  generateMockMoveNetOutput, 
  getMockPoseDescription, 
  getAllMockScenarios 
} from '../services/MockMoveNetOutput';

type MockScenario = 'standing' | 'sitting' | 'partial' | 'low_confidence';

export const TestKeypointExtractionScreen: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<MockScenario>('standing');
  const [testResults, setTestResults] = useState<PoseDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test configuration
  const testConfig: KeypointExtractionConfig = {
    ...DEFAULT_KEYPOINT_CONFIG,
    confidenceThreshold: 0.3,
    screenWidth: 300,
    screenHeight: 400,
  };

  const runKeypointExtraction = async (scenario: MockScenario) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Testing keypoint extraction with scenario: ${scenario}`);
      
      // Generate mock MoveNet output
      const mockOutput = generateMockMoveNetOutput(scenario);
      console.log(`Generated mock output length: ${mockOutput.length}`);
      
      // Extract keypoints
      const startTime = Date.now();
      const result = extractPoseKeypoints(mockOutput, testConfig);
      const processingTime = Date.now() - startTime;
      
      console.log(`Keypoint extraction completed in ${processingTime}ms`);
      console.log('Results:', {
        overallConfidence: result.overallConfidence,
        validKeypoints: result.validKeypoints,
        totalKeypoints: 17
      });
      
      setTestResults(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Keypoint extraction failed:', err);
      setError(errorMessage);
      Alert.alert('Test Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Run test when scenario changes
  useEffect(() => {
    runKeypointExtraction(currentScenario);
  }, [currentScenario]);

  const renderScenarioButtons = () => {
    const scenarios: MockScenario[] = ['standing', 'sitting', 'partial', 'low_confidence'];
    
    return (
      <View style={styles.scenarioContainer}>
        <Text style={styles.sectionTitle}>Test Scenarios</Text>
        {scenarios.map((scenario) => (
          <TouchableOpacity
            key={scenario}
            style={[
              styles.scenarioButton,
              currentScenario === scenario && styles.activeScenarioButton
            ]}
            onPress={() => setCurrentScenario(scenario)}
            disabled={isLoading}
          >
            <Text style={[
              styles.scenarioButtonText,
              currentScenario === scenario && styles.activeScenarioButtonText
            ]}>
              {scenario.charAt(0).toUpperCase() + scenario.slice(1).replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderKeypointDetails = () => {
    if (!testResults) return null;

    const { keypoints } = testResults;
    const keypointEntries = Object.entries(keypoints);

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Keypoint Details</Text>
        <ScrollView style={styles.keypointList} showsVerticalScrollIndicator={false}>
          {keypointEntries.map(([name, keypoint], index) => (
            <View key={name} style={styles.keypointItem}>
              <Text style={styles.keypointName}>
                {index + 1}. {name}
              </Text>
              <Text style={styles.keypointCoords}>
                ({keypoint.x.toFixed(3)}, {keypoint.y.toFixed(3)})
              </Text>
              <Text style={[
                styles.keypointConfidence,
                { color: getConfidenceColor(keypoint.confidence) }
              ]}>
                {(keypoint.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSummary = () => {
    if (!testResults) return null;

    const { overallConfidence, validKeypoints, processingTime } = testResults;
    const confidencePercentage = (overallConfidence * 100).toFixed(1);
    const highConfidenceCount = Object.values(testResults.keypoints)
      .filter(kp => kp.confidence >= 0.7).length;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Detection Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Scenario:</Text>
          <Text style={styles.summaryValue}>
            {currentScenario.charAt(0).toUpperCase() + currentScenario.slice(1).replace('_', ' ')}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Overall Confidence:</Text>
          <Text style={[
            styles.summaryValue,
            { color: getConfidenceColor(overallConfidence) }
          ]}>
            {confidencePercentage}%
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Valid Keypoints:</Text>
          <Text style={styles.summaryValue}>
            {validKeypoints}/17 (>{(testConfig.confidenceThreshold * 100).toFixed(0)}%)
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>High Confidence:</Text>
          <Text style={styles.summaryValue}>
            {highConfidenceCount}/17 (>70%)
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Processing Time:</Text>
          <Text style={styles.summaryValue}>{processingTime}ms</Text>
        </View>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {getMockPoseDescription(currentScenario)}
          </Text>
        </View>
      </View>
    );
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return '#4CAF50'; // Green
    if (confidence >= 0.5) return '#FF9800'; // Orange
    if (confidence >= 0.3) return '#FF5722'; // Red-orange
    return '#757575'; // Gray
  };

  const runAllTests = async () => {
    setIsLoading(true);
    console.log('Running all keypoint extraction tests...');
    
    try {
      const scenarios = getAllMockScenarios();
      const results = [];
      
      for (const scenario of scenarios) {
        console.log(`Testing scenario: ${scenario.name}`);
        const result = extractPoseKeypoints(scenario.output, testConfig);
        results.push({
          scenario: scenario.name,
          description: scenario.description,
          overallConfidence: result.overallConfidence,
          validKeypoints: result.validKeypoints,
          processingTime: result.processingTime
        });
      }
      
      console.log('All tests completed:', results);
      Alert.alert(
        'All Tests Complete',
        `Tested ${results.length} scenarios successfully. Check console for detailed results.`
      );
      
    } catch (err) {
      console.error('Batch testing failed:', err);
      Alert.alert('Batch Test Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Keypoint Extraction Test</Text>
        <TouchableOpacity
          style={styles.testAllButton}
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.testAllButtonText}>
            {isLoading ? 'Testing...' : 'Test All Scenarios'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderScenarioButtons()}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Processing keypoint extraction...</Text>
          </View>
        )}

        {testResults && !isLoading && (
          <>
            {renderSummary()}
            {renderKeypointDetails()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  testAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scenarioContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  scenarioButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeScenarioButton: {
    backgroundColor: '#007AFF',
  },
  scenarioButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  activeScenarioButtonText: {
    fontWeight: '600',
  },
  summaryContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 12,
    fontStyle: 'italic',
  },
  detailsContainer: {
    padding: 20,
  },
  keypointList: {
    maxHeight: 400,
  },
  keypointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#444',
  },
  keypointName: {
    color: '#fff',
    fontSize: 12,
    flex: 2,
  },
  keypointCoords: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  keypointConfidence: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FF5722',
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});