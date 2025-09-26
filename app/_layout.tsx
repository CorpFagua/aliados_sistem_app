// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useColorScheme, Platform, KeyboardAvoidingView } from "react-native"
import AuthProvider from "@/providers/AuthProvider"
import { GestureHandlerRootView } from "react-native-gesture-handler"

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <AuthProvider>
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
              contentStyle: {
                backgroundColor: '#111',
              },
              animation: Platform.OS === 'ios' ? 'default' : 'fade',
            }}
          >
            
          </Stack>
          <StatusBar style="light" />
        </KeyboardAvoidingView>
      </ThemeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  )
}
