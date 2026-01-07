// src/screens/DashboardScreen.tsx
import { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import NavigationMenu from "@/modules/dashboard/components/NavigationMenu";
import { Colors } from "@/constans/colors";

// Pantallas
import DisponiblesScreen from "./screens/DisponiblesScreen";
import AsignadosScreen from "./screens/AsignadosScreen";
import EnRutaScreen from "./screens/EnRutaScreen";

const mobileMenuItems = [
  { id: "disponibles", label: "Disponibles", icon: "list-outline" as const },
  { id: "asignados", label: "Asignados", icon: "storefront-outline" as const },
  { id: "en-camino", label: "En Ruta", icon: "flash-outline" as const },
];

// const desktopMenuItems = [
//   { id: "orders", label: "Pedidos", icon: "cube-outline" as const },
//   { id: "management", label: "Gestión", icon: "settings-outline" as const },
//   { id: "analytics", label: "Analíticas", icon: "bar-chart-outline" as const },
//   { id: "createService", label: "Crear servicio", icon: "add-circle-outline" as const },
// ];

export default function DeliveryHome() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [activeSection, setActiveSection] = useState("disponibles");

  const renderContent = () => {
    switch (activeSection) {
      case "disponibles":
        return <DisponiblesScreen />;
      case "asignados":
        return <AsignadosScreen />;
      case "en-camino":
        return <EnRutaScreen />;
      default:
        return <DisponiblesScreen />;
    }
  };

  return (
    <SafeAreaView  style={styles.safeArea} edges={["bottom"]}>
      <Header  profileRoute="/delivery/profile" />

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
    paddingTop: 8,
  },
});
