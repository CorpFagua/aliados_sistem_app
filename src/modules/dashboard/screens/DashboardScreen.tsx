import { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import NavigationMenu from "../components/NavigationMenu";
import OrdersList from "../components/OrdersList";
import { Colors } from "@/constans/colors";

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
  { id: "createService", label: "Crear servicio", icon: "add-circle-outline" as const },
];

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [activeSection, setActiveSection] = useState("home");

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      {/* Header solo en desktop */}
      {isLargeScreen && <Header />}

      <View style={styles.container}>
        {/* Sidebar en desktop */}
        {isLargeScreen && (
          <NavigationMenu
            active={activeSection}
            onSelect={setActiveSection}
            mobileItems={mobileMenuItems}
            desktopItems={desktopMenuItems}
          />
        )}

        {/* Contenido dinámico */}
        <View style={styles.content}>
          <OrdersList section={activeSection} />
        </View>
      </View>

      {/* Tab bar en móvil */}
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
    padding: 20,
  },
});
