import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { LinearGradient } from "expo-linear-gradient";
import ServiceFormModal from "../components/ServiceFormModalCoordinator";
import CoordinatorOrderCard from "../components/CoordiatorOrderCard";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuth } from "@/providers/AuthProvider";
import { useServices } from "@/providers/ServicesProvider";
import { useUnreadMessagesContext } from "@/providers/UnreadMessagesProvider";
import { Service } from "@/models/service";
import { filterServicesByType } from "@/utils/serviceTypeUtils";
import { fetchMyBranchConfig, updateMyBranchConfig, BranchConfig } from "@/services/branches";

const TABS = ["Disponibles", "Tomados", "En ruta"];
const SERVICE_TYPE_FILTERS = ["Todos", "Domicilios", "Paquetería"];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const { session } = useAuth();
  const { services, loading, refetch } = useServices();
  const { registerServices } = useUnreadMessagesContext();

  const [activeTab, setActiveTab] = useState("Disponibles");
  const [activeServiceTypeFilter, setActiveServiceTypeFilter] = useState("Todos");
  const [selectedOrder, setSelectedOrder] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [branchConfig, setBranchConfig] = useState<BranchConfig | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [tempLowDemand, setTempLowDemand] = useState(false);
  const [tempMaxServices, setTempMaxServices] = useState("3");

  // 🎯 Agrupar servicios por estado
  const pedidos = useMemo(() => {
    return {
      Disponibles: services.filter((s) => s.status === "disponible"),
      Tomados: services.filter((s) => s.status === "asignado"),
      "En ruta": services.filter((s) => s.status === "en_ruta"),
    };
  }, [services]);

  // Registrar todos los servicios visibles (disponibles, asignados, en_ruta)
  useEffect(() => {
    const visibleIds = [
      ...pedidos.Disponibles.map((s) => s.id),
      ...pedidos.Tomados.map((s) => s.id),
      ...pedidos["En ruta"].map((s) => s.id),
    ];
    registerServices(visibleIds);
  }, [pedidos, registerServices]);

  // Cargar configuración de sucursal al montar (solo coordinador/super_admin)
  useEffect(() => {
    if (!session) return;

    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const config = await fetchMyBranchConfig(session.access_token);
        if (config) {
          setBranchConfig(config);
          setTempLowDemand(config.low_demand);
          setTempMaxServices(String(config.low_demand_max_services || 3));
        }
      } catch (err) {
        console.error("❌ Error cargando configuración de sucursal:", err);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, [session]);

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

          {/* Botón Baja Demanda (pequeño, no intrusivo) */}
          <TouchableOpacity
            style={styles.lowDemandButton}
            onPress={() => {
              if (branchConfig) {
                setTempLowDemand(branchConfig.low_demand);
                setTempMaxServices(String(branchConfig.low_demand_max_services || 3));
              }
              setConfigModalVisible(true);
            }}
            disabled={configLoading}
          >
            <Ionicons
              name={branchConfig?.low_demand ? "flame" : "flame-outline"}
              size={20}
              color={branchConfig?.low_demand ? Colors.gradientEnd : Colors.activeMenuText}
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

      {/* Modal configuración de Baja Demanda */}
      <Modal
        visible={configModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.configOverlay}>
          <View style={styles.configModal}>
            <View style={styles.configHeader}>
              <Text style={styles.configTitle}>Baja demanda</Text>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.normalText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.configSubtitle}>
              Limita cuántos servicios activos puede tener cada domiciliario
              en esta sucursal cuando baja demanda está activa.
            </Text>

            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Activar baja demanda</Text>
              <TouchableOpacity
                style={styles.togglePill}
                onPress={() => setTempLowDemand((prev) => !prev)}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    tempLowDemand && styles.toggleKnobActive,
                  ]}
                />
                <Text style={styles.toggleText}>
                  {tempLowDemand ? "Activa" : "Inactiva"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.configRowColumn}>
              <Text style={styles.configLabel}>Máx. servicios por domiciliario</Text>
              <TextInput
                style={styles.configInput}
                keyboardType="numeric"
                value={tempMaxServices}
                onChangeText={(text) => setTempMaxServices(text.replace(/[^0-9]/g, ""))}
                placeholder="3"
                placeholderTextColor={Colors.menuText}
              />
            </View>

            <TouchableOpacity
              style={styles.configSaveButton}
              onPress={async () => {
                if (!session) return;
                const max = parseInt(tempMaxServices || "0", 10);
                if (!max || max <= 0) {
                  alert("El número máximo debe ser mayor que 0");
                  return;
                }

                try {
                  setSavingConfig(true);
                  const updated = await updateMyBranchConfig(session.access_token, {
                    low_demand: tempLowDemand,
                    low_demand_max_services: max,
                  });
                  setBranchConfig(updated);
                  setConfigModalVisible(false);
                } catch (err: any) {
                  console.error("❌ Error guardando configuración de sucursal:", err);
                  alert(err?.message || "No se pudo guardar la configuración");
                } finally {
                  setSavingConfig(false);
                }
              }}
              disabled={savingConfig}
            >
              <Text style={styles.configSaveText}>
                {savingConfig ? "Guardando..." : "Guardar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  lowDemandButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
  configOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  configModal: {
    width: "88%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  configHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  configSubtitle: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 12,
  },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  configRowColumn: {
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 6,
  },
  configInput: {
    borderWidth: 1,
    borderColor: Colors.Border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.normalText,
    backgroundColor: Colors.Background,
    fontSize: 14,
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.Border,
    gap: 8,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.menuText,
  },
  toggleKnobActive: {
    backgroundColor: Colors.gradientEnd,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.normalText,
  },
  configSaveButton: {
    marginTop: 8,
    backgroundColor: Colors.gradientStart,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  configSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
});
