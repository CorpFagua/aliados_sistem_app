/**
 * HistoryFilters - Filtros compactos sin emojis, con iconos
 * Previene reinicio de búsqueda cuando se escribe
 */

import React, { useState, useCallback, useRef } from "react";
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
import { Colors } from "../constans/colors";
import { ServiceHistoryFilters } from "../hooks/useServiceHistory";

interface HistoryFiltersProps {
  onFiltersChange: (filters: Partial<ServiceHistoryFilters>) => void;
  onSearch: (searchTerm: string) => void;
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
  { label: "Pagado", value: true },
  { label: "Pendiente", value: false },
];

export default function HistoryFilters({
  onFiltersChange,
  onSearch,
  loading = false,
}: HistoryFiltersProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedPayment, setSelectedPayment] = useState<boolean | undefined>();
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  // Ref para debounce de búsqueda (no reinicia otros filtros)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);

      // Cancelar búsqueda anterior
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce: esperar 300ms antes de hacer la búsqueda
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(text);
      }, 300);
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

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setSelectedType(undefined);
    setSelectedStatus(undefined);
    setSelectedPayment(undefined);
    setStartDate(undefined);
    setEndDate(undefined);

    onFiltersChange({
      search: "",
      type: undefined,
      status: undefined,
      isPaid: undefined,
      startDate: undefined,
      endDate: undefined,
      offset: 0,
    });

    // También limpiar búsqueda con debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    onSearch("");
  }, [onFiltersChange, onSearch]);

  const hasActiveFilters =
    searchText ||
    selectedType ||
    selectedStatus ||
    selectedPayment !== undefined ||
    startDate ||
    endDate;

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tienda, cliente..."
          placeholderTextColor={Colors.menuText}
          value={searchText}
          onChangeText={handleSearchChange}
          editable={!loading}
          autoCorrect={false}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => handleSearchChange("")}>
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
                : "Pago"}
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
              <View style={styles.dateInputsContainer}>
                <Text style={styles.dateLabel}>Desde:</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.menuText}
                  value={startDate || ""}
                  onChangeText={(text) => handleDateRangeChange("start", text || undefined)}
                />
              </View>
              <View style={styles.dateInputsContainer}>
                <Text style={styles.dateLabel}>Hasta:</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.menuText}
                  value={endDate || ""}
                  onChangeText={(text) => handleDateRangeChange("end", text || undefined)}
                />
              </View>
              <TouchableOpacity
                style={styles.dateConfirmBtn}
                onPress={() => setShowDateMenu(false)}
              >
                <Text style={styles.dateConfirmBtnText}>Aplicar</Text>
              </TouchableOpacity>
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
});
