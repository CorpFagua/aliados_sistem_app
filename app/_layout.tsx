// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useColorScheme, Platform, KeyboardAvoidingView } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import AuthProvider from "@/providers/AuthProvider"
import { ServicesProvider } from "@/providers/ServicesProvider" // 👈 NUEVO
import { UnreadMessagesProvider } from "@/providers/UnreadMessagesProvider" // 👈 NUEVO
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Toast from "react-native-toast-message"
import { useEffect } from "react"
import { LogBox } from "react-native"

// Suprimir warnings específicos de keep-awake que no afectan la funcionalidad
LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'Uncaught (in promise',
]);


function AppContent() {
  const colorScheme = useColorScheme();


  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
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
    </SafeAreaProvider>
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
