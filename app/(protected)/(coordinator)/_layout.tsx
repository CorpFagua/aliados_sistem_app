// app/(protected)/delivery/_layout.tsx
import { Stack } from "expo-router";

export default function CoordinatorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
