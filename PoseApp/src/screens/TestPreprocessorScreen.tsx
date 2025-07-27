import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { ImagePreprocessorDemo } from '../components/ImagePreprocessorDemo';

export const TestPreprocessorScreen: React.FC = () => {
  const [useFallback, setUseFallback] = useState(false);
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
        <Text style={styles.label}>
          Mode: {useFallback ? 'Fallback (YUV→RGB)' : 'Plugin (Hardware)'}
        </Text>
        <Switch
          value={useFallback}
          onValueChange={setUseFallback}
        />
      </View>
      
      <ImagePreprocessorDemo 
        useFallback={useFallback}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 16,
  },
});