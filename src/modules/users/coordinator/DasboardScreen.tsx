
import { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import NavigationMenu from "@/modules/dashboard/components/NavigationMenu";
import { Colors } from "@/constans/colors";

// Pantallas
import HomeScreen from "./screens/HomeScreen";
import ManagementScreen from "./screens/ManagementScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import HistorialScreen from "./screens/HistorialScreen";
import PaymentsScreen from "./screens/PaymentsScreen";
import StoreDebtScreen from "./screens/StoreDebtScreen";

const mobileMenuItems = [
  { id: "home", label: "Home", icon: "home-outline" as const },
  { id: "management", label: "Gestión", icon: "settings-outline" as const },
  { id: "notifications", label: "Notificaciones", icon: "notifications-outline" as const },
  { id: "profile", label: "Perfil", icon: "person-outline" as const },
];

const desktopMenuItems = [
  { id: "orders", label: "Pedidos", icon: "cube-outline" as const },
  { id: "management", label: "Gestión", icon: "settings-outline" as const },
  { id: "analytics", label: "Analíticas", icon: "bar-chart-outline" as const },
  { id: "payments", label: "Pagos", icon: "card-outline" as const },
  { id: "debt", label: "Deuda", icon: "alert-circle-outline" as const },
  { id: "historial", label: "Historial", icon: "time-outline" as const },
  { id: "profile", label: "Perfil", icon: "person-outline" as const },
];

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <HomeScreen />;
      case "management":
        return <ManagementScreen />;
      case "notifications":
        return <NotificationsScreen />;
      case "profile":
        return <ProfileScreen />;
      case "analytics":
        return <AnalyticsScreen />;
      case "payments":
        return <PaymentsScreen />;
      case "debt":
        return <StoreDebtScreen />;
      case "historial":
        return <HistorialScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      {isLargeScreen && <Header profileRoute="/(coordinator)/profile" />}

      <View style={styles.container}>
        {isLargeScreen && (
          <NavigationMenu
            active={activeSection}
            onSelect={setActiveSection}
            mobileItems={mobileMenuItems}
            desktopItems={desktopMenuItems}
          />
        )}

        <View style={styles.content}>{renderContent()}</View>
      </View>

      {!isLargeScreen && (
        <NavigationMenu
          active={activeSection}
          onSelect={setActiveSection}
          mobileItems={mobileMenuItems}
          desktopItems={desktopMenuItems}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.activeMenuBackground,
  },
  content: {
    flex: 1,
    
  },
});
