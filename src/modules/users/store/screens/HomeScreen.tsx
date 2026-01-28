import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { LinearGradient } from "expo-linear-gradient";
import ServiceFormModal from "../components/ServiceFormModal";
import StoreOrderCard from "../components/StoreOrderCard";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuth } from "@/providers/AuthProvider";
import { useServices } from "@/providers/ServicesProvider";
import { Service } from "@/models/service";

const TABS = ["Disponibles", "Tomados", "En ruta"];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const { session } = useAuth();
  const { services, loading, refetch } = useServices();

  const [activeTab, setActiveTab] = useState("Disponibles");
  const [selectedOrder, setSelectedOrder] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 🎯 Agrupar servicios por estado
  const pedidos = useMemo(() => {
    return {
      Disponibles: services.filter((s) => s.status === "disponible"),
      Tomados: services.filter((s) => s.status === "asignado"),
      "En ruta": services.filter((s) => s.status === "en_ruta"),
    };
  }, [services]);

  // 🔄 Recargar servicios
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const EmptyState = ({ tabName }: { tabName: string }) => {
    const getEmptyIcon = () => {
      switch (tabName) {
        case "Disponibles":
          return "package-variant";
        case "Tomados":
          return "checkbox-marked-circle-outline";
        case "En ruta":
          return "truck-fast";
        default:
          return "package-variant";
      }
    };

    const getEmptyMessage = () => {
      switch (tabName) {
        case "Disponibles":
          return "No hay servicios disponibles";
        case "Tomados":
          return "No hay servicios tomados";
        case "En ruta":
          return "No hay servicios en ruta";
        default:
          return "No hay datos";
      }
    };

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name={getEmptyIcon()}
          size={56}
          color={Colors.menuText}
          style={{ marginBottom: 12 }}
        />
        <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.iconActive} />
        </View>
      ) : (
        <>
          {/* Tabs móviles */}
          {isMobile && (
            <View style={styles.tabsWrapper}>
              <View style={styles.tabsContainer}>
                <View style={styles.tabs}>
                  {TABS.map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Botón Reload */}
                <TouchableOpacity 
                  style={styles.reloadButton}
                  onPress={handleRefresh}
                  disabled={refreshing}
                >
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color={Colors.activeMenuText}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Listado */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }} />
            {(isTablet || isLargeScreen) && (
              <TouchableOpacity 
                style={styles.reloadButton}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={Colors.activeMenuText}
                />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              (isTablet || isLargeScreen) && styles.scrollContentDesktop,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {isMobile && (
              <>
                {pedidos[activeTab].length === 0 ? (
                  <EmptyState tabName={activeTab} />
                ) : (
                  pedidos[activeTab].map((pedido) => (
                    <StoreOrderCard
                      key={pedido.id}
                      pedido={pedido}
                      onPress={() => setSelectedOrder(pedido)}
                      showCreatedAt
                    />
                  ))
                )}
              </>
            )}

            {(isTablet || isLargeScreen) && (
              <View style={styles.columnsWrapper}>
                {TABS.map((tab, idx) => (
                  <View
                    key={tab}
                    style={[styles.column, idx < TABS.length - 1 && styles.columnSpacing]}
                  >
                    <Text style={styles.columnTitle}>{tab}</Text>
                    <View style={styles.columnInner}>
                      {pedidos[tab].length === 0 ? (
                        <EmptyState tabName={tab} />
                      ) : (
                        pedidos[tab].map((pedido) => (
                          <StoreOrderCard
                            key={pedido.id}
                            pedido={pedido}
                            onPress={() => setSelectedOrder(pedido)}
                            showCreatedAt
                          />
                        ))
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Modal detalle */}
      <OrderDetailModal
        visible={!!selectedOrder}
        pedido={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onRefresh={refetch}
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
          refetch();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.Background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: Colors.menuText,
    fontSize: 16,
    fontWeight: "500",
  },
  tabsWrapper: { paddingTop: 10, paddingBottom: 12 },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 30,
    padding: 4,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  reloadButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: Colors.activeMenuText,
    justifyContent: "center",
    alignItems: "center",
  },
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
