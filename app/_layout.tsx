// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useColorScheme, Platform, KeyboardAvoidingView } from "react-native"
import AuthProvider from "@/providers/AuthProvider"
import { ServicesProvider } from "@/providers/ServicesProvider" // 👈 NUEVO
import { UnreadMessagesProvider } from "@/providers/UnreadMessagesProvider" // 👈 NUEVO
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Toast from "react-native-toast-message"


function AppContent() {
  const colorScheme = useColorScheme();


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#111" },
              animation: Platform.OS === "ios" ? "default" : "fade",
            }}
          />
          <StatusBar style="light" />
          <Toast />
        </KeyboardAvoidingView>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ServicesProvider>
        <UnreadMessagesProvider>
          <AppContent />
        </UnreadMessagesProvider>
      </ServicesProvider>
    </AuthProvider>
  );
}
