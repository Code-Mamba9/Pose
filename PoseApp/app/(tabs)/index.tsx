import { Image } from "expo-image";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CameraPermissionHandler } from "@/components/CameraPermissionHandler";
import { useCameraPermissions } from "@/utils/PermissionManager";

export default function HomeScreen() {
  const { hasPermission, requestPermissions } = useCameraPermissions();

  const handleTestCameraPermission = async () => {
    console.log('Testing camera permission...');
    const result = await requestPermissions();
    console.log('Permission result:', result);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Pose Detection App</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Camera Permission Status</ThemedText>
        <ThemedText>
          Camera Access: {hasPermission ? '✅ Granted' : '❌ Not Granted'}
        </ThemedText>
        {!hasPermission && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleTestCameraPermission}
          >
            <ThemedText style={styles.buttonText}>Request Camera Permission</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Camera Permission Test</ThemedText>
        <ThemedText>
          This demonstrates the runtime permission handling system for camera access.
        </ThemedText>
        <CameraPermissionHandler>
          <ThemedView style={styles.successContainer}>
            <ThemedText style={styles.successText}>
              🎉 Camera permission granted! Ready for pose detection.
            </ThemedText>
          </ThemedView>
        </CameraPermissionHandler>
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  testButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    color: '#2D5A2D',
    textAlign: 'center',
    fontWeight: '500',
  },
});
