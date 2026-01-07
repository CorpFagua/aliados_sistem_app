// src/screens/DashboardScreen.tsx
import { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import NavigationMenu from "@/modules/dashboard/components/NavigationMenu";
import { Colors } from "@/constans/colors";

// Pantallas
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import NotificationsScreen from "./screens/NotificationsScreen";

const mobileMenuItems = [
  { id: "home", label: "Home", icon: "home-outline" as const },
];

// const desktopMenuItems = [
//   { id: "orders", label: "Pedidos", icon: "cube-outline" as const },
//   { id: "management", label: "Gestión", icon: "settings-outline" as const },
//   { id: "analytics", label: "Analíticas", icon: "bar-chart-outline" as const },
//   { id: "createService", label: "Crear servicio", icon: "add-circle-outline" as const },
// ];

export default function StoreHome() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <HomeScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView  style={styles.safeArea} edges={["top", "bottom"]}>
      {isLargeScreen && <Header profileRoute="/store/profile" />} 

      <View style={styles.container}>
        {isLargeScreen && (
          <NavigationMenu
            active={activeSection}
            onSelect={setActiveSection}
            mobileItems={mobileMenuItems}

          />
        )}

        <View style={styles.content}>{renderContent()}</View>
      </View>

      {!isLargeScreen && (
        <NavigationMenu
          active={activeSection}
          onSelect={setActiveSection}
          mobileItems={mobileMenuItems}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.Background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12, // 👈 más compacto en móvil
    paddingTop: 8,
  },
});
