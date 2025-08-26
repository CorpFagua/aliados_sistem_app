import { View, StyleSheet, ImageBackground, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import LoginForm from "../../src/modules/auth/components/LoginForm";

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768; // tablets/desktop

  return (
    <ImageBackground
      source={require("../../assets/images/Background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <BlurView
          intensity={90}
          tint="light"
          style={[
            styles.glassContainer,
            { width: isLargeScreen ? 400 : width * 0.9 }, // 400px en grande, 90% en móviles
          ]}
        >
          <LoginForm />
        </BlurView>
      </View>
      <StatusBar style="light" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  glassContainer: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
