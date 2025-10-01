import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import ZonesScreen from "./management/ZonesScreen"; // 👈 tu componente de Zonas
import StorePricesScreen from "./management/ZonesPriceScreen";
import { useAuth } from "@/providers/AuthProvider";




const managementOptions = [
  {
    id: "stores",
    label: "Tiendas",
    description: "Gestiona todas las tiendas registradas",
    icon: "storefront-outline",
  },
  {
    id: "deliveries",
    label: "Domiciliarios",
    description: "Administra a los domiciliarios de tu sucursal",
    icon: "bicycle-outline",
  },
  {
    id: "zones",
    label: "Zonas",
    description: "Configura las zonas disponibles para pedidos",
    icon: "map-outline",
  },
  {
    id: "prices",
    label: "Precios por Zona",
    description: "Asigna precios a cada tienda según la zona",
    icon: "pricetag-outline",
  },
];

export default function ManagementScreen() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const {session} = useAuth();

  const renderModule = () => {
  switch (activeModule) {
    case "zones":
      return <ZonesScreen />;
    case "prices":
      return <StorePricesScreen token={session?.access_token} />;
    // más adelante puedes agregar:
    // case "stores": return <StoresScreen />;
    // case "deliveries": return <DeliveriesScreen />;
    default:
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Gestión del Coordinador</Text>
          <Text style={styles.subtitle}>
            Selecciona un módulo para administrar la información
          </Text>

          <View style={styles.cardsContainer}>
            {managementOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => setActiveModule(option.id)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={32}
                  color={Colors.activeMenuText}
                />
                <Text style={styles.cardTitle}>{option.label}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      );
  }
};


  return (
    <View style={{ flex: 1 }}>
      {activeModule ? (
        <View style={{ flex: 1 }}>
          {/* Botón de volver */}
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveModule(null)}>
            <Ionicons name="arrow-back" size={22} color={Colors.normalText} />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>

          {renderModule()}
        </View>
      ) : (
        renderModule()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 20,
    width: "48%",
    minHeight: 140,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.menuText,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.activeMenuBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  backText: {
    marginLeft: 6,
    fontSize: 15,
    color: Colors.normalText,
    fontWeight: "500",
  },
});
