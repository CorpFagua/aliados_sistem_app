/**
 * HistoryFilters - Filtros compactos sin emojis, con iconos
 * Previene reinicio de búsqueda cuando se escribe
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "../constans/colors";
import { ServiceHistoryFilters } from "../hooks/useServiceHistory";
import { useAuth } from "../providers/AuthProvider";
import { fetchDeliveries } from "../services/users";

interface HistoryFiltersProps {
  onFiltersChange: (filters: Partial<ServiceHistoryFilters>) => void;
  onSearch: (searchTerm: string) => void;
  onClear?: () => void;
  loading?: boolean;
}

const SERVICE_TYPES = [
  { label: "Todos", value: undefined },
  { label: "Domicilio", value: "domicilio" },
  { label: "Paquetería Aliados", value: "paqueteria_aliados" },
  { label: "Paquetería Coordinadora", value: "paqueteria_coordinadora" },
];

const SERVICE_STATUS = [
  { label: "Todos", value: undefined },
  { label: "Disponible", value: "disponible" },
  { label: "Asignado", value: "asignado" },
  { label: "En Ruta", value: "en_ruta" },
  { label: "Entregado", value: "entregado" },
  { label: "Cancelado", value: "cancelado" },
];

const PAYMENT_STATUS = [
  { label: "Todos", value: undefined },
  { label: "Pagada", value: true },
  { label: "Pendiente", value: false },
];

export default function HistoryFilters({
  onFiltersChange,
  onSearch,
  onClear,
  loading = false,
}: HistoryFiltersProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedPayment, setSelectedPayment] = useState<boolean | undefined>();
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [showCalendar, setShowCalendar] = useState<null | { field: "start" | "end" }>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [showDeliveryMenu, setShowDeliveryMenu] = useState(false);
  const [deliveryQuery, setDeliveryQuery] = useState("");
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | undefined>(undefined);
  const [selectedDeliveryName, setSelectedDeliveryName] = useState<string | undefined>(undefined);

  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  // Ref para debounce de búsqueda (no reinicia otros filtros)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deliverySearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { session } = useAuth();

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);

      // Cancelar búsqueda anterior
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce: esperar 300ms antes de hacer la búsqueda
      // Solo busca si el texto tiene al menos 2 caracteres o está vacío
      if (text.length >= 2 || text === "") {
        searchTimeoutRef.current = setTimeout(() => {
          onSearch(text.trim());
        }, 300);
      }
    },
    [onSearch]
  );

  const handleTypeChange = useCallback(
    (type: string | undefined) => {
      setSelectedType(type);
      setShowTypeMenu(false);
      // Mantiene los demás filtros, solo cambia el tipo
      onFiltersChange({ type: type as any, offset: 0 });
    },
    [onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (status: string | undefined) => {
      setSelectedStatus(status);
      setShowStatusMenu(false);
      onFiltersChange({ status: status as any, offset: 0 });
    },
    [onFiltersChange]
  );

  const handlePaymentChange = useCallback(
    (payment: boolean | undefined) => {
      setSelectedPayment(payment);
      setShowPaymentMenu(false);
      onFiltersChange({ isPaid: payment, offset: 0 });
    },
    [onFiltersChange]
  );

  const handleDateRangeChange = useCallback(
    (type: "start" | "end", date: string | undefined) => {
      if (type === "start") {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      onFiltersChange({
        startDate: type === "start" ? date : startDate,
        endDate: type === "end" ? date : endDate,
        offset: 0,
      });
    },
    [startDate, endDate, onFiltersChange]
  );

  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const formatISO = (d: Date) => d.toISOString().slice(0, 10);

  const onPickDate = useCallback(
    (d: Date) => {
      const iso = formatISO(d);
      if (showCalendar?.field === "start") {
        setStartDate(iso);
        onFiltersChange({ startDate: iso, offset: 0 });
      }
      if (showCalendar?.field === "end") {
        setEndDate(iso);
        onFiltersChange({ endDate: iso, offset: 0 });
      }
      setShowCalendar(null);
    },
    [showCalendar, onFiltersChange]
  );

  const isBetween = useCallback(
    (iso: string) => {
      if (!startDate || !endDate) return false;
      return iso > startDate && iso < endDate;
    },
    [startDate, endDate]
  );

  const loadDeliveries = useCallback(
    async (q?: string) => {
      if (!session?.access_token) return;
      setLoadingDeliveries(true);
      try {
        const list = await fetchDeliveries(session.access_token, q);
        setDeliveries(list || []);
      } catch (err) {
        console.error("Error cargando domiciliarios:", err);
      } finally {
        setLoadingDeliveries(false);
      }
    },
    [session?.access_token]
  );

  useEffect(() => {
    // Cargar una lista inicial pequeña al montar
    if (showDeliveryMenu) {
      loadDeliveries("");
    }
  }, [showDeliveryMenu, loadDeliveries]);

  const handleDeliverySearchChange = useCallback(
    (text: string) => {
      setDeliveryQuery(text);

      if (deliverySearchTimeoutRef.current) clearTimeout(deliverySearchTimeoutRef.current);

      deliverySearchTimeoutRef.current = setTimeout(() => {
        loadDeliveries(text.trim());
      }, 300);
    },
    [loadDeliveries]
  );

  const handleDeliverySelect = useCallback(
    (delivery: any) => {
      setSelectedDeliveryId(delivery.id);
      setSelectedDeliveryName(delivery.name || delivery.fullName || delivery.phone || delivery.id);
      setShowDeliveryMenu(false);
      setDeliveryQuery("");
      onFiltersChange({ deliveryId: delivery.id, offset: 0 });
    },
    [onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setSelectedType(undefined);
    setSelectedStatus(undefined);
    setSelectedPayment(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedDeliveryId(undefined);
    setSelectedDeliveryName(undefined);
    setDeliveryQuery("");
    setDeliveries([]);

    onFiltersChange({
      search: "",
      type: undefined,
      status: undefined,
      isPaid: undefined,
      deliveryId: undefined,
      startDate: undefined,
      endDate: undefined,
      offset: 0,
    });

    // También limpiar búsqueda con debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    onSearch("");

    // Llamar callback opcional
    onClear?.();
  }, [onFiltersChange, onSearch, onClear]);

  const hasActiveFilters =
    searchText ||
    selectedType ||
    selectedStatus ||
    selectedPayment !== undefined ||
    startDate ||
    endDate ||
    selectedDeliveryId;

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tienda, cliente, teléfono..."
          placeholderTextColor={Colors.menuText}
          value={searchText}
          onChangeText={handleSearchChange}
          editable={true}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText ? (
          <TouchableOpacity onPress={() => handleSearchChange("")} disabled={loading}>
            <Text style={styles.clearIcon}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtros en fila compacta */}
      <View style={styles.filtersRow}>
        {/* Tipo */}
        <View style={styles.filterDropdown}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedType && styles.filterBtnActive]}
            onPress={() => setShowTypeMenu(!showTypeMenu)}
            disabled={loading}
          >
            <Text style={styles.filterBtnText}>
              {selectedType ? SERVICE_TYPES.find((t) => t.value === selectedType)?.label : "Tipo"}
            </Text>
            {showTypeMenu && <Text style={styles.dropIcon}>▲</Text>}
            {!showTypeMenu && <Text style={styles.dropIcon}>▼</Text>}
          </TouchableOpacity>

          {showTypeMenu && (
            <View style={styles.dropdown}>
              <FlatList
                data={SERVICE_TYPES}
                keyExtractor={(item) => String(item.value)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleTypeChange(item.value as any)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedType === item.value && styles.dropdownItemActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Estado */}
        <View style={styles.filterDropdown}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedStatus && styles.filterBtnActive]}
            onPress={() => setShowStatusMenu(!showStatusMenu)}
            disabled={loading}
          >
            <Text style={styles.filterBtnText}>
              {selectedStatus
                ? SERVICE_STATUS.find((s) => s.value === selectedStatus)?.label
                : "Estado"}
            </Text>
            {showStatusMenu && <Text style={styles.dropIcon}>▲</Text>}
            {!showStatusMenu && <Text style={styles.dropIcon}>▼</Text>}
          </TouchableOpacity>

          {showStatusMenu && (
            <View style={styles.dropdown}>
              <FlatList
                data={SERVICE_STATUS}
                keyExtractor={(item) => String(item.value)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleStatusChange(item.value as any)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedStatus === item.value && styles.dropdownItemActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Pago */}
        <View style={styles.filterDropdown}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedPayment !== undefined && styles.filterBtnActive]}
            onPress={() => setShowPaymentMenu(!showPaymentMenu)}
            disabled={loading}
          >
            <Text style={styles.filterBtnText}>
              {selectedPayment !== undefined
                ? PAYMENT_STATUS.find((p) => p.value === selectedPayment)?.label
                : "Pago Admin"}
            </Text>
            {showPaymentMenu && <Text style={styles.dropIcon}>▲</Text>}
            {!showPaymentMenu && <Text style={styles.dropIcon}>▼</Text>}
          </TouchableOpacity>

          {showPaymentMenu && (
            <View style={styles.dropdown}>
              <FlatList
                data={PAYMENT_STATUS}
                keyExtractor={(item, idx) => `payment-${idx}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handlePaymentChange(item.value as any)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedPayment === item.value && styles.dropdownItemActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Fecha */}
        <View style={styles.filterDropdown}>
          <TouchableOpacity
            style={[styles.filterBtn, (startDate || endDate) && styles.filterBtnActive]}
            onPress={() => setShowDateMenu(!showDateMenu)}
            disabled={loading}
          >
            <Text style={styles.filterBtnText}>
              {startDate || endDate ? "Fechas" : "Fecha"}
            </Text>
            {showDateMenu && <Text style={styles.dropIcon}>▲</Text>}
            {!showDateMenu && <Text style={styles.dropIcon}>▼</Text>}
          </TouchableOpacity>

          {showDateMenu && (
            <View style={styles.dropdown}>
              <View style={{ padding: 8, flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.dateInputTouchable]} onPress={() => { setShowCalendar({ field: 'start' }); setCalendarMonth(new Date(startDate || Date.now())); }}>
                  <Text style={styles.dateInputText}>{startDate || 'Desde'}</Text>
                  <Ionicons name="calendar-outline" size={18} color={Colors.menuText} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dateInputTouchable]} onPress={() => { setShowCalendar({ field: 'end' }); setCalendarMonth(new Date(endDate || Date.now())); }}>
                  <Text style={styles.dateInputText}>{endDate || 'Hasta'}</Text>
                  <Ionicons name="calendar-outline" size={18} color={Colors.menuText} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Domiciliario */}
        <View style={styles.filterDropdown}>
          <TouchableOpacity
            style={[styles.filterBtn, selectedDeliveryId && styles.filterBtnActive]}
            onPress={() => setShowDeliveryMenu(!showDeliveryMenu)}
            disabled={loading}
          >
            <Text style={styles.filterBtnText}>
              {selectedDeliveryName ? selectedDeliveryName : "Domiciliario"}
            </Text>
            {showDeliveryMenu && <Text style={styles.dropIcon}>▲</Text>}
            {!showDeliveryMenu && <Text style={styles.dropIcon}>▼</Text>}
          </TouchableOpacity>

          {showDeliveryMenu && (
            <View style={[styles.dropdown, { minWidth: 240 }]}>
              <View style={{ padding: 8 }}>
                <TextInput
                  style={[styles.dateInput, { width: 200 }]}
                  placeholder="Buscar domiciliario..."
                  placeholderTextColor={Colors.menuText}
                  value={deliveryQuery}
                  onChangeText={handleDeliverySearchChange}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
              {loadingDeliveries ? (
                <View style={{ padding: 12 }}>
                  <ActivityIndicator color={Colors.activeMenuText} />
                </View>
              ) : (
                <FlatList
                  data={deliveries}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleDeliverySelect(item)}
                    >
                      <Text style={styles.dropdownItemText}>{item.name || item.fullName || item.phone || item.id}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
        </View>

        {/* Limpiar */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters} disabled={loading}>
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Calendar modal (reutiliza UI del proyecto) */}
      <Modal visible={!!showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}
        >
          <View style={[styles.modalCalendar, { width: '92%', maxWidth: 420 }]}> 
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                  <Ionicons name="chevron-back" size={22} color={Colors.menuText} />
                </TouchableOpacity>
                <Text style={{ color: Colors.normalText, fontWeight: 'bold' }}>{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                  <Ionicons name="chevron-forward" size={22} color={Colors.menuText} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={{ color: Colors.menuText, fontSize: 12 }}>Inicio:</Text>
                  <Text style={{ color: Colors.normalText, fontWeight: '700' }}>{startDate || '-'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={{ color: Colors.menuText, fontSize: 12 }}>Fin:</Text>
                  <Text style={{ color: Colors.normalText, fontWeight: '700' }}>{endDate || '-'}</Text>
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={{ color: Colors.menuText, fontSize: 12 }}>Seleccionando: {showCalendar?.field === 'start' ? 'Desde' : 'Hasta'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((w) => (
                <Text key={w} style={{ width: 36, textAlign: 'center', color: Colors.menuText, fontWeight: '600' }}>{w}</Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {(() => {
                const first = startOfMonth(calendarMonth);
                const lead = first.getDay();
                const total = daysInMonth(calendarMonth);
                const nodes = [] as any[];
                for (let i = 0; i < lead; i++) nodes.push(<View key={'e' + i} style={{ width: 36, height: 36, margin: 2 }} />);
                for (let d = 1; d <= total; d++) {
                  const cur = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                  const iso = formatISO(cur);
                  const isStart = iso === startDate;
                  const isEnd = iso === endDate;
                  const inRange = isBetween(iso);

                  const dayStyle: any = { width: 36, height: 36, margin: 2, borderRadius: 6, justifyContent: 'center', alignItems: 'center' };
                  const textStyle: any = { color: Colors.menuText };

                  if (isStart) { dayStyle.backgroundColor = Colors.activeMenuText; textStyle.color = Colors.Background; }
                  else if (isEnd) { dayStyle.backgroundColor = Colors.success; textStyle.color = Colors.Background; }
                  else if (inRange) { dayStyle.backgroundColor = Colors.gradientStart; textStyle.color = Colors.Background; }

                  nodes.push(
                    <TouchableOpacity key={iso} onPress={() => onPickDate(cur)} style={dayStyle}>
                      <Text style={textStyle}>{d}</Text>
                    </TouchableOpacity>
                  );
                }
                return nodes;
              })()}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowCalendar(null)}>
                <Text style={styles.cancelButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={() => { if (showCalendar?.field === 'start') { setStartDate(undefined); onFiltersChange({ startDate: undefined, offset: 0 }); } else { setEndDate(undefined); onFiltersChange({ endDate: undefined, offset: 0 }); } setShowCalendar(null); }}>
                <Text style={styles.confirmButtonText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.Background,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.Border,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.normalText,
    paddingVertical: 0,
  },

  clearIcon: {
    fontSize: 20,
    color: Colors.menuText,
    marginLeft: 8,
    fontWeight: "600",
  },

  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },

  filterDropdown: {
    position: "relative",
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    gap: 4,
    minWidth: 75,
  },

  filterBtnActive: {
    backgroundColor: Colors.activeMenuText,
    borderColor: Colors.activeMenuText,
  },

  filterBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.normalText,
    flex: 1,
  },

  filterBtnActiveText: {
    color: Colors.Background,
  },

  dropIcon: {
    fontSize: 9,
    color: Colors.menuText,
    fontWeight: "600",
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    minWidth: 140,
    zIndex: 1000,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    maxHeight: 200,
  },

  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },

  dropdownItemText: {
    fontSize: 12,
    color: Colors.normalText,
  },

  dropdownItemActive: {
    fontWeight: "700",
    color: Colors.activeMenuText,
  },

  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },

  clearBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#991B1B",
  },

  dateInputsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },

  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 4,
  },

  dateInput: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: Colors.Background,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.Border,
    fontSize: 12,
    color: Colors.normalText,
  },

  dateConfirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.activeMenuText,
    borderRadius: 4,
    margin: 8,
    alignItems: "center",
  },

  dateConfirmBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.Background,
  },
  dateInputTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.Background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    gap: 8,
  },
  dateInputTouchableWide: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.Background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    gap: 8,
    minWidth: 140,
  },
  dateInputText: {
    color: Colors.normalText,
    marginRight: 8,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCalendar: {
    backgroundColor: Colors.Background,
    borderRadius: 8,
    padding: 12,
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: Colors.activeMenuBackground,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  confirmButton: {
    backgroundColor: Colors.activeMenuText,
  },
  cancelButtonText: { color: Colors.menuText },
  confirmButtonText: { color: Colors.Background, fontWeight: '700' },
});
