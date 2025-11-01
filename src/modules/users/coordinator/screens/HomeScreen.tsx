import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { LinearGradient } from "expo-linear-gradient";
import ServiceFormModal from "../components/ServiceFormModalCoordinator";
import CoordinatorOrderCard from "../components/CoordiatorOrderCard";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuth } from "@/providers/AuthProvider";
import { fetchServices } from "@/services/services";
import { Service } from "@/models/service";

const TABS = ["Disponibles", "Tomados", "En ruta"];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState("Disponibles");
  const [selectedOrder, setSelectedOrder] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 👇 Estado de pedidos tipado
  const [pedidos, setPedidos] = useState<Record<string, Service[]>>({
    Disponibles: [],
    Tomados: [],
    "En ruta": [],
  });

  // ⚡ Traer servicios del backend
  useEffect(() => {
    if (!session) return;

    const loadServices = async () => {
      try {
        const data = await fetchServices(session.access_token);

        const grouped: Record<string, Service[]> = {
          Disponibles: data.filter((s) => s.status === "disponible"),
          Tomados: data.filter((s) => s.status === "asignado"),
          "En ruta": data.filter((s) => s.status === "en_ruta"),
        };

        setPedidos(grouped);
      } catch (err) {
        console.error(err);
      }
    };

    loadServices();
  }, [session]);

  return (
    <View style={styles.container}>
      {/* Tabs móviles */}
      {isMobile && (
        <View style={styles.tabsWrapper}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Listado */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          (isTablet || isLargeScreen) && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isMobile &&
          pedidos[activeTab].map((pedido) => (
            <CoordinatorOrderCard
              key={pedido.id}
              pedido={pedido}
              onPress={() => setSelectedOrder(pedido)}
            />
          ))}

        {(isTablet || isLargeScreen) && (
          <View style={styles.columnsWrapper}>
            {TABS.map((tab, idx) => (
              <View
                key={tab}
                style={[
                  styles.column,
                  idx < TABS.length - 1 && styles.columnSpacing,
                ]}
              >
                <Text style={styles.columnTitle}>{tab}</Text>
                <View style={styles.columnInner}>
                  {pedidos[tab].map((pedido) => (
                    <CoordinatorOrderCard
                      key={pedido.id}
                      pedido={pedido}
                      onPress={() => setSelectedOrder(pedido)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal detalle */}
      <OrderDetailModal
        visible={!!selectedOrder}
        pedido={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onRefresh={() => {
          if (session) {
            fetchServices(session.access_token).then((data) => {
              const grouped = {
                Disponibles: data.filter((s) => s.status === "disponible"),
                Tomados: data.filter((s) => s.status === "asignado"),
                "En ruta": data.filter((s) => s.status === "en_ruta"),
              };
              setPedidos(grouped);
            });
          }
        }}
      />

      {/* Botón FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#000" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal de crear servicio */}
      <ServiceFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false);
          if (session) {
            fetchServices(session.access_token).then((data) => {
              const grouped: Record<string, Service[]> = {
                Disponibles: data.filter((s) => s.status === "disponible"),
                Tomados: data.filter((s) => s.status === "asignado"),
                "En ruta": data.filter((s) => s.status === "en_ruta"),
              };
              setPedidos(grouped);
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.Background, paddingTop: 20 },
  tabsWrapper: { paddingTop: 10, paddingBottom: 12 },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 30,
    padding: 4,
    marginHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTabButton: { backgroundColor: Colors.iconActive },
  tabText: { color: Colors.menuText, fontSize: 14, fontWeight: "500" },
  activeTabText: { color: "#000", fontWeight: "700" },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 12 },
  scrollContentDesktop: { paddingBottom: 40, paddingHorizontal: 20 },
  columnsWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    minWidth: 280,
    maxWidth: 420,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ffffff06",
  },
  columnSpacing: { marginRight: 18 },
  columnTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.activeMenuText,
    marginBottom: 12,
    marginLeft: 4,
  },
  columnInner: { paddingTop: 6 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  fabGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
});
