import { View, StyleSheet, useWindowDimensions, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import LoginForm from "../../src/modules/auth/components/LoginForm";

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const cardWidth = isLargeScreen ? 400 : width;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {isLargeScreen ? (
          <LinearGradient
            colors={["#00FF75", "#2563EB"]}
            start={[0, 0]}
            end={[1, 1]}
            style={[styles.card, { width: cardWidth }]}
          >
            <View style={styles.innerCard}>
              <LoginForm />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.mobileContainer}>
            <LoginForm />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111",
  },
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 22,
    shadowColor: "#00FF75",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
    padding: 3,
  },
  innerCard: {
    backgroundColor: "#171717",
    borderRadius: 19,
    paddingVertical: 36,
    paddingHorizontal: 28,
    minWidth: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileContainer: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
});
