import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { ImagePreprocessorDemo } from '../components/ImagePreprocessorDemo';

export const TestPreprocessorScreen: React.FC = () => {
  const [enablePoseDetection, setEnablePoseDetection] = useState(false);
  const [mockScenario, setMockScenario] = useState<'standing' | 'sitting' | 'partial' | 'low_confidence'>('standing');
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.label}>
            Pipeline: {enablePoseDetection ? 'Full (Preprocess + Pose)' : 'Preprocessing Only'}
          </Text>
          <Switch
            value={enablePoseDetection}
            onValueChange={setEnablePoseDetection}
          />
        </View>
        <Text style={styles.infoText}>
          Uses optimized preprocessing functions with software fallback
        </Text>
        {enablePoseDetection && (
          <View style={styles.scenarioContainer}>
            <Text style={styles.scenarioLabel}>Mock Pose Scenario:</Text>
            <View style={styles.scenarioButtons}>
              {(['standing', 'sitting', 'partial', 'low_confidence'] as const).map((scenario) => (
                <TouchableOpacity
                  key={scenario}
                  style={[
                    styles.scenarioButton,
                    mockScenario === scenario && styles.activeScenarioButton
                  ]}
                  onPress={() => setMockScenario(scenario)}
                >
                  <Text style={[
                    styles.scenarioButtonText,
                    mockScenario === scenario && styles.activeScenarioButtonText
                  ]}>
                    {scenario.charAt(0).toUpperCase() + scenario.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
      
      <ImagePreprocessorDemo 
        device={device}
        enablePoseDetection={enablePoseDetection}
        mockScenario={mockScenario}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  controls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    color: 'white',
    fontSize: 16,
  },
  infoText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  scenarioContainer: {
    marginTop: 12,
  },
  scenarioLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  scenarioButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scenarioButton: {
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
  },
  activeScenarioButton: {
    backgroundColor: '#007AFF',
  },
  scenarioButtonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  activeScenarioButtonText: {
    fontWeight: '600',
  },
});