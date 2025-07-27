import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { ImagePreprocessorDemo } from '../components/ImagePreprocessorDemo';

export const TestPreprocessorScreen: React.FC = () => {
  const [useFallback, setUseFallback] = useState(false);
  const [useOptimized, setUseOptimized] = useState(true);
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
            Mode: {useFallback ? 'Fallback (YUV→RGB)' : 'Plugin (Hardware)'}
          </Text>
          <Switch
            value={useFallback}
            onValueChange={setUseFallback}
          />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.label}>
            Algorithm: {useOptimized ? 'Optimized' : 'Standard'}
          </Text>
          <Switch
            value={useOptimized}
            onValueChange={setUseOptimized}
          />
        </View>
      </View>
      
      <ImagePreprocessorDemo 
        useFallback={useFallback}
        useOptimized={useOptimized}
        device={device}
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
});