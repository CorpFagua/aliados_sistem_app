import { useState } from "react";
import { View, StyleSheet } from "react-native";
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
  { id: "notifications", label: "Notificaciones", icon: "notifications-outline" as const },
  { id: "profile", label: "Perfil", icon: "person-outline" as const },
];

export default function StoreHome() {
  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <HomeScreen />;
      case "notifications":
        return <NotificationsScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header profileRoute="/store/profile" />

      <View style={styles.content}>{renderContent()}</View>

      <NavigationMenu
        active={activeSection}
        onSelect={setActiveSection}
        mobileItems={mobileMenuItems}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  content: {
    flex: 1,
  },
});
