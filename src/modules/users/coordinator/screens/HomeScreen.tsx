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
import ServiceFormModal from "../components/ServiceFormModalCoordinator";
import CoordinatorOrderCard from "../components/CoordiatorOrderCard";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuth } from "@/providers/AuthProvider";
import { useServices } from "@/providers/ServicesProvider";
import { Service } from "@/models/service";
import { filterServicesByType } from "@/utils/serviceTypeUtils";

const TABS = ["Disponibles", "Tomados", "En ruta"];
const SERVICE_TYPE_FILTERS = ["Todos", "Domicilios", "Paquetería"];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const { session } = useAuth();
  const { services, loading, refetch } = useServices();

  const [activeTab, setActiveTab] = useState("Disponibles");
  const [activeServiceTypeFilter, setActiveServiceTypeFilter] = useState("Todos");
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

  // 🔄 Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // 🔄 Aplicar filtro de tipo de servicio
  const getFilteredPedidos = (tab: string): Service[] => {
    const tabPedidos = pedidos[tab] || [];
    const filterTypeMap: Record<string, "todos" | "domicilio" | "paqueteria"> = {
      Todos: "todos",
      Domicilios: "domicilio",
      Paquetería: "paqueteria",
    };
    return filterServicesByType(tabPedidos, filterTypeMap[activeServiceTypeFilter]);
  };

  return (
    <View style={styles.container}>
      {/* Tabs de estado (Disponibles, Tomados, En ruta) - solo mobile */}
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

      {/* Tabs de tipo de servicio (Todos, Domicilios, Paquetería) */}
      <View style={styles.serviceTypeFiltersWrapper}>
        <View style={styles.filterHeaderRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.serviceTypeFilters}
          >
            {SERVICE_TYPE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.serviceTypeFilterButton,
                  activeServiceTypeFilter === filter &&
                    styles.activeServiceTypeFilterButton,
                ]}
                onPress={() => setActiveServiceTypeFilter(filter)}
              >
                <Text
                  style={[
                    styles.serviceTypeFilterText,
                    activeServiceTypeFilter === filter &&
                      styles.activeServiceTypeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Botón Reload */}
          <TouchableOpacity 
            style={styles.reloadButton}
            onPress={onRefresh}
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

      {/* Listado */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          (isTablet || isLargeScreen) && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.iconActive} />
            <Text style={styles.loadingText}>Cargando servicios...</Text>
          </View>
        ) : isMobile && getFilteredPedidos(activeTab).length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={
                activeTab === "Disponibles"
                  ? "package-variant"
                  : activeTab === "Tomados"
                  ? "checkbox-marked-circle-outline"
                  : "truck-fast"
              }
              size={48}
              color={Colors.normalText}
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateTitle}>
              {activeTab === "Disponibles"
                ? "No hay servicios disponibles"
                : activeTab === "Tomados"
                ? "No hay servicios tomados"
                : "No hay servicios en ruta"}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === "Disponibles"
                ? "Los nuevos servicios aparecerán aquí"
                : activeTab === "Tomados"
                ? "Asigna una zona para ver servicios aquí"
                : "Los servicios en ruta aparecerán aquí"}
            </Text>
          </View>
        ) : (
          <>
            {isMobile &&
              getFilteredPedidos(activeTab).map((pedido) => (
                <CoordinatorOrderCard
                  key={pedido.id}
                  pedido={pedido}
                  onPress={() => setSelectedOrder(pedido)}
                />
              ))}
          </>
        )}

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
                  {loading ? (
                    <View style={styles.loadingColumn}>
                      <ActivityIndicator size="small" color={Colors.iconActive} />
                      <Text style={styles.loadingColumnText}>Cargando...</Text>
                    </View>
                  ) : getFilteredPedidos(tab).length === 0 ? (
                    <View style={styles.emptyColumn}>
                      <MaterialCommunityIcons
                        name={
                          tab === "Disponibles"
                            ? "package-variant"
                            : tab === "Tomados"
                            ? "checkbox-marked-circle-outline"
                            : "truck-fast"
                        }
                        size={36}
                        color={Colors.menuText}
                      />
                      <Text style={styles.emptyColumnText}>
                        {tab === "Disponibles"
                          ? "No hay disponibles"
                          : tab === "Tomados"
                          ? "No hay tomados"
                          : "No hay en ruta"}
                      </Text>
                    </View>
                  ) : (
                    getFilteredPedidos(tab).map((pedido) => (
                      <CoordinatorOrderCard
                        key={pedido.id}
                        pedido={pedido}
                        onPress={() => setSelectedOrder(pedido)}
                      />
                    ))
                  )}
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
  serviceTypeFiltersWrapper: { paddingHorizontal: 12, paddingVertical: 8 },
  filterHeaderRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    gap: 8,
  },
  serviceTypeFilters: {
    gap: 8,
    paddingHorizontal: 4,
    flex: 1,
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
  serviceTypeFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  activeServiceTypeFilterButton: {
    backgroundColor: Colors.iconActive,
    borderColor: Colors.iconActive,
  },
  serviceTypeFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.menuText,
  },
  activeServiceTypeFilterText: {
    color: "#000",
  },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 12 },
  scrollContentDesktop: { paddingBottom: 40, paddingHorizontal: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.menuText,
  },
  loadingColumn: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingColumnText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.menuText,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyColumn: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyColumnIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyColumnText: {
    fontSize: 12,
    color: Colors.menuText,
    textAlign: "center",
  },
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
