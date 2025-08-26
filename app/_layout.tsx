// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useColorScheme } from "react-native"
import AuthProvider from "@/providers/AuthProvider" // 👈 tu provider

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* auth */}
          <Stack.Screen name="(auth)"  />

          {/* rutas protegidas */}
          <Stack.Screen name="(protected)"  />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  )
}
