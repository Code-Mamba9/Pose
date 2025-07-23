import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CameraView } from "@/components/CameraView";

export default function TabTwoScreen() {
  const handleCameraReady = () => {
    console.log('Camera is ready for pose detection!');
  };

  const handleCameraError = (error: any) => {
    console.error('Camera error in explore tab:', error);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Camera Preview</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Testing camera functionality for pose detection
        </ThemedText>
      </ThemedView>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onCameraReady={handleCameraReady}
          onCameraError={handleCameraError}
        />
      </View>

      {/* Info Footer */}
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          • 30 FPS target for smooth processing
        </ThemedText>
        <ThemedText style={styles.footerText}>
          • YUV pixel format for better performance
        </ThemedText>
        <ThemedText style={styles.footerText}>
          • HDR and stabilization disabled for speed
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  footer: {
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
});
