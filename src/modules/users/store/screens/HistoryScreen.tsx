import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Platform,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../../../providers/AuthProvider";
import { fetchServices } from "../../../../services/services";
import { Colors } from "../../../../constans/colors";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatISO = (d: Date): string => d.toISOString().slice(0, 10);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

const isSameDateDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Funciones responsivas
const getResponsiveSize = () => {
  const { width, height } = Dimensions.get("window");
  return {
    windowWidth: width,
    windowHeight: height,
    isTablet: width >= 768,
    isMobile: width < 768,
    isLandscape: width > height,
  };
};

export default function StoreHistoryScreen() {
  const { session } = useAuth();
  const { back } = useRouter();
  const windowDimensions = useWindowDimensions();
  const { isTablet, isMobile, windowWidth } = getResponsiveSize();
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado único para los datos filtrados
  const [filteredData, setFilteredData] = useState({
    items: [] as any[],
    page: 1,
    hasMore: true,
    loading: true,
    refreshing: false,
    totalCount: 0,
  });

  const [allServices, setAllServices] = useState<any[]>([]);
  const ITEMS_PER_PAGE = 15;

  // Helper para obtener datos filtrados
  const getFilteredServices = (): any[] => {
    let filtered = allServices;

    // Si mostrar todos está activo, no filtrar por fecha
    if (!showAllOrders) {
      // Filtrar por fecha
      filtered = filtered.filter((service) => {
        const serviceDate = new Date(service.createdAt);
        return isSameDateDay(serviceDate, selectedDate);
      });
    }

    // Filtrar por método de pago
    if (selectedPaymentMethod) {
      filtered = filtered.filter(
        (service) => service.payment === selectedPaymentMethod
      );
    }

    return filtered;
  };

  // Obtener métodos de pago únicos
  const getAvailablePaymentMethods = (): string[] => {
    const methods = new Set<string>();
    allServices
      .filter((service) => {
        const serviceDate = new Date(service.createdAt);
        return isSameDateDay(serviceDate, selectedDate);
      })
      .forEach((service) => {
        if (service.payment) {
          methods.add(service.payment);
        }
      });
    return Array.from(methods).sort();
  };

  // Cargar y paginar servicios
  const applyFiltersAndPaginate = (pageNum: number = 1) => {
    const filtered = getFilteredServices();
    const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
    const paginatedServices = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const hasMore = startIndex + ITEMS_PER_PAGE < filtered.length;

    return {
      items: paginatedServices,
      totalCount: filtered.length,
      hasMore,
    };
  };

  useEffect(() => {
    if (session?.access_token) {
      console.log(`🏪 [StoreHistory] Iniciando carga de servicios...`);
      loadServices();
    }
  }, [session?.access_token]);

  // Recargar filtros cuando cambia fecha, método de pago o modo todos
  useEffect(() => {
    const result = applyFiltersAndPaginate(1);
    setFilteredData({
      items: result.items,
      page: 2,
      hasMore: result.hasMore,
      loading: false,
      refreshing: false,
      totalCount: result.totalCount,
    });
  }, [selectedDate, selectedPaymentMethod, showAllOrders, allServices]);

  const loadServices = async (isRefresh: boolean = false) => {
    if (!session?.access_token) {
      setError("No hay sesión activa");
      setFilteredData((prev) => ({ ...prev, loading: false }));
      return;
    }

    if (isRefresh) {
      setFilteredData((prev) => ({ ...prev, refreshing: true }));
    } else {
      setFilteredData((prev) => ({ ...prev, loading: true }));
    }

    setError(null);
    try {
      const services = await fetchServices(session.access_token);
      console.log(`✅ [StoreHistory] Servicios obtenidos: ${services.length}`);
      setAllServices(services);
      
      const result = applyFiltersAndPaginate(1);
      setFilteredData({
        items: result.items,
        page: 2,
        hasMore: result.hasMore,
        loading: false,
        refreshing: false,
        totalCount: result.totalCount,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error al cargar servicios";
      console.error("❌ Error en loadServices:", err);
      setError(message);
      setFilteredData((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        items: [],
      }));
    }
  };

  const handleLoadMore = () => {
    if (!filteredData.loading && filteredData.hasMore) {
      const result = applyFiltersAndPaginate(filteredData.page);
      setFilteredData({
        ...filteredData,
        items: [...filteredData.items, ...result.items],
        page: filteredData.page + 1,
        hasMore: result.hasMore,
      });
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handlePaymentMethodChange = (method: string | null) => {
    setSelectedPaymentMethod(method);
    setShowPaymentFilter(false);
  };

  const handleRefresh = () => {
    loadServices(true);
  };

  const handlePickDate = (d: Date) => {
    setSelectedDate(d);
    setShowDatePicker(false);
  };

  const handleNavigateMonth = (direction: 'prev' | 'next') => {
    setCalendarMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleShowAll = () => {
    if (showAllOrders) {
      // Si ya está activo, lo desactivamos
      setShowAllOrders(false);
      setShowDatePicker(true);
    } else {
      // Si está inactivo, lo activamos
      setShowAllOrders(true);
      setShowDatePicker(false);
    }
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    const statusColor = item.status === "entregado" ? "#4caf50" : item.status === "pago" ? "#2196F3" : "#ff3d00";
    const statusLabel = item.status === "entregado" ? "Entregado" : item.status === "pago" ? "Pago" : "Cancelado";
    
    return (
      <TouchableOpacity
        style={[styles.orderCard, item.status === "cancelado" && styles.orderCardCancelled]}
        onPress={() => {
          setSelectedOrder(item);
          setShowModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Header: Número de pedido + Status Badge */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Pedido #{item.id?.slice(-6) || "N/A"}</Text>
            <Text style={styles.cardDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-CO", { 
                day: "2-digit", 
                month: "short", 
                year: "numeric" 
              }) : "N/A"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons 
              name={item.status === "entregado" ? "checkmark-circle" : item.status === "pago" ? "checkmark-circle" : "close-circle"}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Detalles principales */}
        <View style={styles.cardDetailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <AntDesign name="user" size={14} color="#2196F3" style={{ marginRight: 6 }} />
                <Text style={styles.detailLabel}>Cliente</Text>
              </View>
              <Text style={styles.detailValue}>{item.clientName || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <MaterialCommunityIcons name="truck-fast" size={14} color="#9C27B0" style={{ marginRight: 6 }} />
                <Text style={styles.detailLabel}>Domiciliario</Text>
              </View>
              <Text style={styles.detailValue}>{item.assignedDeliveryName || "Pendiente"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#FF9800" style={{ marginRight: 6 }} />
                <Text style={styles.detailLabel}>Dirección</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>{item.destination || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Total y Método */}
        <View style={styles.cardFooterSection}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Cobrado</Text>
            <Text style={styles.amountValue}>{formatCurrency(parseFloat(item.amount) || 0)}</Text>
          </View>
          <View style={styles.methodBox}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <MaterialCommunityIcons name="credit-card" size={14} color="#2196F3" style={{ marginRight: 6 }} />
              <Text style={styles.detailLabel}>Método</Text>
            </View>
            <Text style={styles.detailValue}>{item.payment || "N/A"}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardTapIndicator}>
          <Text style={styles.cardTapText}>Ver más detalles →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (message: string) => (
    <ScrollView
      contentContainerStyle={styles.emptyContent}
      refreshControl={<RefreshControl refreshing={filteredData.refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.emptyState}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#e8f5e9", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 2, borderColor: "#4caf50" }}>
          <Text style={{ fontSize: 44, fontWeight: "300", color: "#4caf50" }}>✓</Text>
        </View>
        <Text style={styles.emptyStateTitle}>{message}</Text>
        <Text style={styles.emptyStateText}>
          Aquí aparecerán los pedidos cuando haya actividad
        </Text>
      </View>
    </ScrollView>
  );

  const availablePaymentMethods = getAvailablePaymentMethods();

  if (filteredData.loading && filteredData.items.length === 0 && allServices.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={{ backgroundColor: "#fee2e2", padding: 12, marginBottom: 10, marginHorizontal: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#dc2626" }}>
          <Text style={{ color: "#7f1d1d", fontWeight: "700", marginBottom: 4, fontSize: 13 }}>Error al cargar servicios</Text>
          <Text style={{ color: "#991b1b", fontSize: 12, marginBottom: 8 }}>{String(error)}</Text>
          <TouchableOpacity style={{ paddingVertical: 6 }} onPress={() => loadServices(false)}>
            <Text style={{ color: Colors.activeMenuText, fontWeight: "600", fontSize: 12 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View
        style={[
          styles.header,
          {
            paddingHorizontal: isMobile ? 12 : 16,
            paddingVertical: isMobile ? 12 : 16,
          },
        ]}
      >
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: isMobile ? 8 : 10,
          }}
          onPress={() => back()}
        >
          <AntDesign
            name="arrow-left"
            size={isMobile ? 20 : 24}
            color={Colors.normalText}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontSize: isMobile ? 18 : 24 },
            ]}
          >
            Historial de Pedidos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtros: Fecha y Método de Pago */}
      <View
        style={[
          styles.filtersContainer,
          {
            flexDirection: isMobile ? "column" : "row",
            paddingHorizontal: isMobile ? 12 : 16,
            paddingVertical: isMobile ? 10 : 12,
            gap: isMobile ? 10 : 12,
          },
        ]}
      >
        {/* Selector de Fecha */}
        <TouchableOpacity 
          style={[
            styles.filterButton,
            {
              flex: isMobile ? 1 : 0.48,
            },
          ]}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: isMobile ? 6 : 8 }}>
            <Ionicons
              name="calendar"
              size={isMobile ? 16 : 18}
              color={Colors.activeMenuText}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.filterButtonLabel,
                  { fontSize: isMobile ? 10 : 11 },
                ]}
              >
                Fecha
              </Text>
              <Text
                style={[
                  styles.filterButtonValue,
                  { fontSize: isMobile ? 11 : 12 },
                ]}
                numberOfLines={1}
              >
                {showAllOrders
                  ? "Todos"
                  : selectedDate.toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
              </Text>
            </View>
          </View>
          <AntDesign
            name={showDatePicker ? "up" : "down"}
            size={isMobile ? 14 : 16}
            color={Colors.activeMenuText}
          />
        </TouchableOpacity>

        {/* Selector de Método de Pago */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              flex: isMobile ? 1 : 0.48,
            },
          ]}
          onPress={() => setShowPaymentFilter(!showPaymentFilter)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: isMobile ? 6 : 8 }}>
            <MaterialCommunityIcons
              name="credit-card"
              size={isMobile ? 16 : 18}
              color={Colors.activeMenuText}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.filterButtonLabel,
                  { fontSize: isMobile ? 10 : 11 },
                ]}
              >
                Método
              </Text>
              <Text
                style={[
                  styles.filterButtonValue,
                  { fontSize: isMobile ? 11 : 12 },
                ]}
                numberOfLines={1}
              >
                {selectedPaymentMethod || "Todos"}
              </Text>
            </View>
          </View>
          <AntDesign 
            name={showPaymentFilter ? "up" : "down"} 
            size={isMobile ? 14 : 16}
            color={Colors.activeMenuText} 
          />
        </TouchableOpacity>
      </View>

      {/* Modal de Calendario Completo */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <View
            style={[
              styles.calendarModalContent,
              {
                width: isMobile ? "92%" : isTablet ? "95%" : "90%",
                maxWidth: 480,
                marginHorizontal: isMobile ? 16 : 24,
                paddingHorizontal: isMobile ? 16 : 24,
                paddingVertical: isMobile ? 16 : 20,
              },
            ]}
          >
            {/* Header del Calendario */}
            <View style={styles.calendarHeader}>
              <Text
                style={[
                  styles.calendarTitle,
                  { fontSize: isMobile ? 16 : 18 },
                ]}
              >
                Seleccionar Fecha
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeCalendarBtn}>
                <Ionicons name="close" size={isMobile ? 22 : 24} color={Colors.menuText} />
              </TouchableOpacity>
            </View>

            {/* Navegación de Meses */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity 
                style={styles.monthNavBtn}
                onPress={() => handleNavigateMonth('prev')}
              >
                <Ionicons name="chevron-back" size={isMobile ? 18 : 20} color={Colors.activeMenuText} />
              </TouchableOpacity>
              
              <Text
                style={[
                  styles.monthYearText,
                  { fontSize: isMobile ? 14 : 16 },
                ]}
              >
                {calendarMonth.toLocaleString("es-CO", { 
                  month: "long", 
                  year: "numeric" 
                }).charAt(0).toUpperCase() + 
                calendarMonth.toLocaleString("es-CO", { 
                  month: "long", 
                  year: "numeric" 
                }).slice(1)}
              </Text>
              
              <TouchableOpacity 
                style={styles.monthNavBtn}
                onPress={() => handleNavigateMonth('next')}
              >
                <Ionicons name="chevron-forward" size={isMobile ? 18 : 20} color={Colors.activeMenuText} />
              </TouchableOpacity>
            </View>

            {/* Información de la Fecha Seleccionada */}
            <View style={styles.selectedDateInfo}>
              <Text
                style={[
                  styles.selectedDateLabel,
                  { fontSize: isMobile ? 10 : 11 },
                ]}
              >
                Fecha seleccionada:
              </Text>
              <Text
                style={[
                  styles.selectedDateValue,
                  { fontSize: isMobile ? 12 : 14 },
                ]}
              >
                {selectedDate.toLocaleDateString("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).charAt(0).toUpperCase() + 
                selectedDate.toLocaleDateString("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).slice(1)}
              </Text>
            </View>

            {/* Encabezado de Días */}
            <View style={styles.weekdaysRow}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
                <Text
                  key={day}
                  style={[
                    styles.weekdayText,
                    { fontSize: isMobile ? 10 : 12 },
                  ]}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Grilla del Calendario */}
            <View style={[styles.calendarGrid, { marginBottom: isMobile ? 12 : 20 }]}>
              {(() => {
                const first = startOfMonth(calendarMonth);
                const lead = first.getDay();
                const total = daysInMonth(calendarMonth);
                const days = [];

                // Días vacíos iniciales
                for (let i = 0; i < lead; i++) {
                  days.push(
                    <View
                      key={`empty-${i}`}
                      style={[
                        styles.dayCell,
                        {
                          width: isMobile ? "14.28%" : "14.28%",
                          aspectRatio: 1,
                          margin: isMobile ? 2 : 4,
                        },
                      ]}
                    />
                  );
                }

                // Días del mes
                for (let d = 1; d <= total; d++) {
                  const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                  const isSelected = isSameDateDay(date, selectedDate);
                  const isToday = isSameDateDay(date, new Date());

                  days.push(
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                        {
                          width: isMobile ? "14.28%" : "14.28%",
                          aspectRatio: 1,
                          margin: isMobile ? 2 : 4,
                        },
                      ]}
                      onPress={() => handlePickDate(date)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          (isSelected || isToday) && styles.dayTextActive,
                          { fontSize: isMobile ? 11 : 13 },
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return days;
              })()}
            </View>

            {/* Botón Todos */}
            <View style={{ marginBottom: isMobile ? 12 : 16 }}>
              <View style={{ position: "relative", width: "100%" }}>
                <TouchableOpacity
                  style={[
                    styles.todosButton,
                    showAllOrders && styles.todosButtonActive,
                  ]}
                  onPress={handleShowAll}
                >
                  <Ionicons
                    name={showAllOrders ? "checkmark-circle" : "apps"}
                    size={isMobile ? 16 : 18}
                    color={showAllOrders ? "#FFFFFF" : Colors.activeMenuText}
                    style={{ marginRight: 8 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.todosButtonTitle,
                        showAllOrders && styles.todosButtonTitleActive,
                        { fontSize: isMobile ? 12 : 14 },
                      ]}
                    >
                      Ver Todos los Pedidos
                    </Text>
                    <Text
                      style={[
                        styles.todosButtonSubtitle,
                        { fontSize: isMobile ? 10 : 11 },
                      ]}
                    >
                      {showAllOrders ? "Mostrando todos" : "Carga progresiva"}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {/* Botón de cerrar cuando "Todos" está activo */}
                {showAllOrders && (
                  <TouchableOpacity
                    style={styles.todosCloseButton}
                    onPress={() => {
                      setShowAllOrders(false);
                      setShowDatePicker(true);
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={isMobile ? 16 : 18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Botones de Acción */}
            <View style={[styles.calendarActions, { gap: isMobile ? 8 : 12 }]}>
              <TouchableOpacity
                style={[
                  styles.calendarButton,
                  styles.calendarCancelButton,
                  { paddingVertical: isMobile ? 10 : 12 },
                ]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.calendarButtonText, { fontSize: isMobile ? 12 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.calendarButton,
                  styles.calendarConfirmButton,
                  { paddingVertical: isMobile ? 10 : 12 },
                ]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.calendarButtonTextConfirm, { fontSize: isMobile ? 12 : 14 }]}>
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown de Métodos de Pago */}
      {showPaymentFilter && (
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.dropdownItem, !selectedPaymentMethod && styles.dropdownItemActive]}
            onPress={() => handlePaymentMethodChange(null)}
          >
            <Text style={[styles.dropdownItemText, !selectedPaymentMethod && styles.dropdownItemTextActive]}>
              Todos los métodos
            </Text>
          </TouchableOpacity>
          {availablePaymentMethods.map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.dropdownItem, selectedPaymentMethod === method && styles.dropdownItemActive]}
              onPress={() => handlePaymentMethodChange(method)}
            >
              <Text style={[styles.dropdownItemText, selectedPaymentMethod === method && styles.dropdownItemTextActive]}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Contador de Pedidos */}
      <View
        style={[
          styles.countContainer,
          {
            paddingHorizontal: isMobile ? 12 : 16,
            paddingVertical: isMobile ? 8 : 10,
            marginBottom: isMobile ? 8 : 10,
          },
        ]}
      >
        <View style={styles.countBox}>
          <Text
            style={[
              styles.countLabel,
              { fontSize: isMobile ? 10 : 11 },
            ]}
          >
            {showAllOrders ? "Total de pedidos" : "Pedidos del día"}
          </Text>
          <Text
            style={[
              styles.countValue,
              { fontSize: isMobile ? 24 : 28 },
            ]}
          >
            {filteredData.totalCount}
          </Text>
        </View>
      </View>

      {/* Content */}
      {filteredData.loading && filteredData.items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.activeMenuText} />
          <Text style={{ marginTop: 10, color: Colors.menuText }}>Cargando pedidos...</Text>
        </View>
      ) : filteredData.items.length === 0 ? (
        renderEmptyState("Sin pedidos en esta fecha")
      ) : (
        <FlatList
          data={filteredData.items}
          keyExtractor={(item) => (item.id ? String(item.id) : Math.random().toString())}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={filteredData.refreshing} onRefresh={handleRefresh} />}
          ListFooterComponent={
            filteredData.loading && filteredData.items.length > 0 ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={Colors.activeMenuText} />
              </View>
            ) : null
          }
        />
      )}

      {/* Modal de detalles */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Pedido</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 8 }}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Status Header */}
                <View style={styles.statusHeader}>
                  <View style={styles.statusHeaderContent}>
                    <Text style={styles.modalOrderId}>Pedido #{selectedOrder.id?.slice(-6)}</Text>
                    <Text style={styles.statusHeaderLabel}>
                      {selectedOrder.status === "entregado" ? "Entregado" : selectedOrder.status === "pago" ? "Pago" : "Cancelado"}
                    </Text>
                  </View>
                  <View style={[styles.largeStatusBadge, { 
                    backgroundColor: selectedOrder.status === "entregado" ? "#4caf50" : selectedOrder.status === "pago" ? "#2196F3" : "#ff3d00" 
                  }]}>
                    <Ionicons 
                      name={selectedOrder.status === "entregado" ? "checkmark-circle" : selectedOrder.status === "pago" ? "checkmark-circle" : "close-circle"}
                      size={32}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Total Cobrado - Destacado */}
                <View style={styles.highlightSection}>
                  <Text style={styles.highlightLabel}>Total Cobrado</Text>
                  <Text style={styles.highlightAmount}>
                    {formatCurrency(parseFloat(selectedOrder.amount) || 0)}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Información del Cliente */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <AntDesign name="user" size={16} color={Colors.activeMenuText} /> Cliente
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Nombre</Text>
                    <Text style={styles.detailValue}>{selectedOrder.clientName || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={styles.detailValue}>{selectedOrder.phone || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Entrega */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={Colors.activeMenuText} /> Entrega
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Dirección</Text>
                    <Text style={styles.detailValue}>{selectedOrder.destination || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Domiciliario</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.assignedDeliveryName || "Pendiente"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Pago */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="cash-check" size={16} color={Colors.activeMenuText} /> Información de Pago
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Método</Text>
                    <Text style={styles.detailValue}>{selectedOrder.payment || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Cronología */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="calendar" size={16} color={Colors.activeMenuText} /> Cronología
                  </Text>

                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: "#2196F3" }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Creado</Text>
                      <Text style={styles.timelineTime}>
                        {selectedOrder.createdAt
                          ? new Date(selectedOrder.createdAt).toLocaleString("es-CO")
                          : "N/A"}
                      </Text>
                    </View>
                  </View>

                  {selectedOrder.assignedAt && (
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: "#FF9800" }]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Asignado</Text>
                        <Text style={styles.timelineTime}>
                          {new Date(selectedOrder.assignedAt).toLocaleString("es-CO")}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedOrder.completedAt && (
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: "#4caf50" }]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Entregado</Text>
                        <Text style={styles.timelineTime}>
                          {new Date(selectedOrder.completedAt).toLocaleString("es-CO")}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {selectedOrder.notes && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="document-text" size={16} color={Colors.activeMenuText} /> Notas
                      </Text>
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>{selectedOrder.notes}</Text>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.normalText,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.menuText,
    fontSize: 14,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.menuText,
    textAlign: "center",
    maxWidth: 300,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.activeMenuText,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.menuText,
  },
  activeTabText: {
    color: Colors.activeMenuText,
  },

  // List
  listContainer: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  orderCardCancelled: {
    opacity: 0.65,
    borderLeftColor: "#ff3d00",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  amountColumn: {
    alignItems: "flex-end",
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  orderDate: {
    fontSize: 12,
    color: "#A0A0A0",
    marginTop: 4,
  },
  orderBody: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B0B0B0",
    marginRight: 12,
    minWidth: 70,
  },
  infoValue: {
    fontSize: 13,
    color: "#E8E8E8",
    fontWeight: "500",
    flex: 1,
  },
  tapIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
  },
  tapText: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "700",
    textAlign: "right",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.Background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.menuText,
    fontWeight: "300",
    lineHeight: 28,
  },
  modalBody: {
    marginBottom: 20,
  },
  summarySection: {
    backgroundColor: "#252527",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#A8A8A8",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.activeMenuText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.Border,
    marginVertical: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
    paddingLeft: 12,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.activeMenuText,
    marginRight: 16,
    marginTop: 3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: "#A0A0A0",
    lineHeight: 18,
  },
  closeModalButton: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuText,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Nuevos estilos para modal mejorado
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#252527",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeaderContent: {
    flex: 1,
  },
  modalOrderId: {
    fontSize: 12,
    color: "#A8A8A8",
    fontWeight: "500",
    marginBottom: 4,
  },
  statusHeaderLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  largeStatusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  largeStatusText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  highlightSection: {
    backgroundColor: "#252527",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    alignItems: "center",
  },
  highlightLabel: {
    fontSize: 12,
    color: "#A8A8A8",
    fontWeight: "500",
    marginBottom: 8,
  },
  highlightAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  notesBox: {
    backgroundColor: "#2A2A2C",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.activeMenuText,
  },
  notesText: {
    fontSize: 13,
    color: "#E8E8E8",
    lineHeight: 19,
    fontWeight: "500",
  },

  // Estilos para la tarjeta (renderOrderCard)
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
  },
  cardDate: {
    fontSize: 11,
    color: "#A8A8A8",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardDetailsSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#A8A8A8",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: 4,
  },
  cardFooterSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  amountBox: {
    flex: 1,
    backgroundColor: "#252527",
    borderRadius: 8,
    padding: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: "#A8A8A8",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.activeMenuText,
    marginTop: 4,
  },
  methodBox: {
    flex: 1,
    backgroundColor: "#252527",
    borderRadius: 8,
    padding: 12,
  },
  cardTapIndicator: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
    alignItems: "flex-end",
  },
  cardTapText: {
    fontSize: 11,
    color: Colors.activeMenuText,
    fontWeight: "700",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 12,
  },
  halfWidth: {
    flex: 1,
  },
  totalSection: {
    backgroundColor: "#252527",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 12,
    color: "#A8A8A8",
    fontWeight: "500",
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
    alignItems: "flex-end",
  },

  // Nuevos estilos para filtros
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#252527",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  filterButtonLabel: {
    fontSize: 11,
    color: "#A8A8A8",
    fontWeight: "600",
  },
  filterButtonValue: {
    fontSize: 13,
    color: Colors.activeMenuText,
    fontWeight: "700",
    marginTop: 4,
  },
  dropdownContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#1C1C1D",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.Border,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  dropdownItemActive: {
    backgroundColor: "#252527",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#E8E8E8",
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: Colors.activeMenuText,
    fontWeight: "700",
  },
  countContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  countBox: {
    backgroundColor: "#252527",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    alignItems: "center",
  },
  countLabel: {
    fontSize: 11,
    color: "#A8A8A8",
    fontWeight: "600",
    marginBottom: 4,
  },
  countValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },

  // Estilos del Calendario Modal
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "web" ? 20 : 10,
  },
  calendarModalContent: {
    backgroundColor: Colors.Background,
    borderRadius: 16,
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  closeCalendarBtn: {
    padding: 8,
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuBackground,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.normalText,
    flex: 1,
    textAlign: "center",
  },
  selectedDateInfo: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  selectedDateLabel: {
    fontSize: 11,
    color: Colors.menuText,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedDateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekdayText: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: Colors.menuText,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 2,
  },
  dayCell: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: Colors.activeMenuText,
  },
  dayCellToday: {
    backgroundColor: "#252527",
    borderWidth: 2,
    borderColor: Colors.activeMenuText,
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.normalText,
  },
  dayTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  calendarActions: {
    flexDirection: "row",
    gap: 12,
  },
  calendarButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarCancelButton: {
    backgroundColor: Colors.activeMenuBackground,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  calendarConfirmButton: {
    backgroundColor: Colors.activeMenuText,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
  },
  calendarButtonTextConfirm: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Estilos del botón "Todos"
  todosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    padding: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.Border,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB800",
  },
  todosButtonActive: {
    backgroundColor: Colors.activeMenuText,
    borderColor: Colors.activeMenuText,
    borderLeftColor: "#FFD700",
  },
  todosButtonTitle: {
    fontWeight: "700",
    color: Colors.normalText,
  },
  todosButtonTitleActive: {
    color: "#FFFFFF",
  },
  todosButtonSubtitle: {
    color: Colors.menuText,
    fontWeight: "500",
    marginTop: 2,
  },
  todosCloseButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -9,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});