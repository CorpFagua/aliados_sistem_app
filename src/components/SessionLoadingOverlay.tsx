import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, Modal } from "react-native";

interface SessionLoadingOverlayProps {
  visible: boolean;
}

export default function SessionLoadingOverlay({ visible }: SessionLoadingOverlayProps) {
  return (
    <Modal
      transparent={false}
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.text}>Recuperando sesión...</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
