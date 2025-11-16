import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchStores } from "@/services/stores";

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  editing?: any | null;
}

export default function ServiceFormModal({
  visible,
  onClose,
  onSuccess,
  editing = null,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "domicilios" | "aliados" | "coordinadora"
  >("domicilios");

  const [destination, setDestination] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<any>("efectivo");
  const [amount, setAmount] = useState("");
  const [prepTime, setPrepTime] = useState("");

  const [pickupAddress, setPickupAddress] = useState("");
  const [aliadosPrice, setAliadosPrice] = useState("");

  const [guideId, setGuideId] = useState("");

  const { session, role } = useAuth();

  const [storeQuery, setStoreQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [storeResults, setStoreResults] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // ESTADO PARA DETECTAR CUÁL INPUT ESTÁ ENFOCADO
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setDestination("");
      setPhone("");
      setNotes("");
      setPayment("efectivo");
      setAmount("");
      setPrepTime("");
      setPickupAddress("");
      setAliadosPrice("");
      setGuideId("");
    }
  }, [visible]);

  const handleSubmit = () => alert("✔️ Formulario listo visualmente");

  const handleSearchStores = async (query: string) => {
    setStoreQuery(query);

    if (!query || query.length < 2) {
      setStoreResults([]);
      return;
    }

    try {
      setLoadingStores(true);
      const allStores = await fetchStores(session?.access_token || "");
      const filtered = allStores
        .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        .map((s) => ({ id: s.id, name: s.name }));

      setStoreResults(filtered);
    } catch (err) {
      console.error("Error buscando tiendas:", err);
    } finally {
      setLoadingStores(false);
    }
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {[
        { key: "domicilios", label: "Domicilios" },
        { key: "aliados", label: "Paquetería Aliados" },
        { key: "coordinadora", label: "Paquetería Coordinadora" },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNotes = () => (
    <>
      <Text style={styles.label}>Notas adicionales</Text>

      <TextInput
        style={styles.notesInput}
        placeholder="Escribe una nota..."
        placeholderTextColor={Colors.menuText}
        value={notes}
        onChangeText={setNotes}
        multiline
      />
    </>
  );

  const renderPaymentSection = () => (
    <>
      <Text style={styles.label}>Método de pago</Text>
      <View style={styles.paymentRow}>
        {["efectivo", "transferencia", "tarjeta"].map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.paymentOption,
              payment === method && styles.paymentOptionActive,
            ]}
            onPress={() => setPayment(method)}
          >
            <Text
              style={[
                styles.paymentText,
                payment === method && styles.paymentTextActive,
              ]}
            >
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {payment === "efectivo" && (
        <>
          <Text style={styles.label}>Monto a recolectar</Text>
          <View style={styles.inputIcon}>
            <Ionicons name="cash-outline" size={18} color={Colors.menuText} />
            <TextInput
              style={styles.inputFlex}
              placeholder="Ej: 25000"
              placeholderTextColor={Colors.menuText}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </>
      )}
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[styles.cardWrapper, isLargeScreen && styles.cardWrapperLarge]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>
              {editing ? "Editar Servicio" : "Crear Servicio"}
            </Text>
            <Text style={styles.subtitle}>Aliados Express</Text>

            {renderTabs()}

            {/* -------- SCROLL INTERNO -------- */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {/* DOMICILIOS */}
              {activeTab === "domicilios" && (
                <>
                  {/* SELECTOR DE TIENDA — SOLO PARA COORDINADOR Y SUPER ADMIN */}
                  {(role === "coordinator" || role === "super_admin") && (
                    <>
                      <Text style={styles.label}>Seleccionar tienda</Text>

                      <View
                        style={[
                          styles.inputIcon,
                          focusedField === "store" && styles.inputIconFocused,
                        ]}
                      >
                        <Ionicons
                          name="storefront-outline"
                          size={18}
                          color={Colors.menuText}
                        />

                        <TextInput
                          style={styles.inputFlex}
                          placeholder="Buscar tienda por nombre"
                          placeholderTextColor={Colors.menuText}
                          value={
                            selectedStore ? selectedStore.name : storeQuery
                          }
                          onChangeText={(t) => {
                            setSelectedStore(null);
                            handleSearchStores(t);
                          }}
                          onFocus={() => setFocusedField("store")}
                          onBlur={() => setFocusedField(null)}
                          selectionColor="transparent"
                        />

                        {selectedStore && (
                          <TouchableOpacity
                            onPress={() => setSelectedStore(null)}
                          >
                            <Ionicons
                              name="close-circle"
                              size={18}
                              color={Colors.menuText}
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* LISTA DE RESULTADOS */}
                      {storeResults.length > 0 && !selectedStore && (
                        <View style={styles.dropdown}>
                          {storeResults.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setSelectedStore(item);
                                setStoreQuery("");
                                setStoreResults([]);
                              }}
                            >
                              <Text style={styles.dropdownText}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  <Text style={styles.label}>Dirección de destino</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "destination" && styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Ej: Cra 10 #20-30"
                      placeholderTextColor={Colors.menuText}
                      value={destination}
                      onChangeText={setDestination}
                      onFocus={() => setFocusedField("destination")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  <Text style={styles.label}>Teléfono</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "phone" && styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="3001234567"
                      placeholderTextColor={Colors.menuText}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  {/* Notas */}
                  <Text style={styles.label}>Notas adicionales</Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      focusedField === "notes" && styles.inputIconFocused,
                    ]}
                    placeholder="Escribe una nota..."
                    placeholderTextColor={Colors.menuText}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    onFocus={() => setFocusedField("notes")}
                    onBlur={() => setFocusedField(null)}
                    selectionColor="transparent"
                  />

                  {renderPaymentSection()}

                  <Text style={styles.label}>Tiempo de llegada (min)</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "prepTime" && styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="timer-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="15"
                      placeholderTextColor={Colors.menuText}
                      keyboardType="numeric"
                      value={prepTime}
                      onChangeText={setPrepTime}
                      onFocus={() => setFocusedField("prepTime")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>
                </>
              )}

              {/* ALIADOS */}
              {activeTab === "aliados" && (
                <>
                  <Text style={styles.label}>Dirección de recogida</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "pickupAddress" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Cra 10 #20-30"
                      placeholderTextColor={Colors.menuText}
                      value={pickupAddress}
                      onChangeText={setPickupAddress}
                      onFocus={() => setFocusedField("pickupAddress")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  <Text style={styles.label}>Dirección de entrega</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "destinationAliado" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Cra 45 #10-20"
                      placeholderTextColor={Colors.menuText}
                      value={destination}
                      onChangeText={setDestination}
                      onFocus={() => setFocusedField("destinationAliado")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  <Text style={styles.label}>Nombre del cliente</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "clientNameAliado" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Juan Pérez"
                      placeholderTextColor={Colors.menuText}
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedField("clientNameAliado")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  <Text style={styles.label}>Teléfono del cliente</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "clientPhoneAliado" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="3009876543"
                      placeholderTextColor={Colors.menuText}
                      value={notes}
                      onChangeText={setNotes}
                      onFocus={() => setFocusedField("clientPhoneAliado")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  {/* Notas */}
                  <Text style={styles.label}>Notas adicionales</Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      focusedField === "notes" && styles.inputIconFocused,
                    ]}
                    placeholder="Escribe una nota..."
                    placeholderTextColor={Colors.menuText}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    onFocus={() => setFocusedField("notes")}
                    onBlur={() => setFocusedField(null)}
                    selectionColor="transparent"
                  />

                  {renderPaymentSection()}

                  <Text style={styles.label}>Precio del envío</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "aliadosPrice" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="8000"
                      placeholderTextColor={Colors.menuText}
                      keyboardType="numeric"
                      value={aliadosPrice}
                      onChangeText={setAliadosPrice}
                      onFocus={() => setFocusedField("aliadosPrice")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>
                </>
              )}

              {/* COORDINADORA */}
              {activeTab === "coordinadora" && (
                <>
                  <Text style={styles.label}>Número de guía</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "guideId" && styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="barcode-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="123456789"
                      placeholderTextColor={Colors.menuText}
                      value={guideId}
                      onChangeText={setGuideId}
                      onFocus={() => setFocusedField("guideId")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  <Text style={styles.label}>Dirección de entrega</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "destinationCoord" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Cra 45 #20-55"
                      placeholderTextColor={Colors.menuText}
                      value={destination}
                      onChangeText={setDestination}
                      onFocus={() => setFocusedField("destinationCoord")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  <Text style={styles.label}>Nombre del cliente</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "clientNameCoord" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="María Gómez"
                      placeholderTextColor={Colors.menuText}
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedField("clientNameCoord")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  <Text style={styles.label}>Teléfono</Text>
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "clientPhoneCoord" &&
                        styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={Colors.menuText}
                    />
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="3009876543"
                      placeholderTextColor={Colors.menuText}
                      value={notes}
                      onChangeText={setNotes}
                      onFocus={() => setFocusedField("clientPhoneCoord")}
                      onBlur={() => setFocusedField(null)}
                      selectionColor="transparent"
                    />
                  </View>

                  {/* Notas */}
                  <Text style={styles.label}>Notas adicionales</Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      focusedField === "notes" && styles.inputIconFocused,
                    ]}
                    placeholder="Escribe una nota..."
                    placeholderTextColor={Colors.menuText}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    onFocus={() => setFocusedField("notes")}
                    onBlur={() => setFocusedField(null)}
                    selectionColor="transparent"
                  />

                  {renderPaymentSection()}
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Guardar servicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  cardWrapper: {
    width: "90%",
    maxHeight: "88%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffffff22",
  },

  cardWrapperLarge: {
    width: 550,
    maxHeight: "88%",
  },

  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 18,
    padding: 20,
    height: "100%",
  },

  scrollArea: {
    flex: 1,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.normalText,
    textAlign: "center",
  },

  subtitle: {
    color: Colors.menuText,
    textAlign: "center",
    marginBottom: 15,
  },

  tabsContainer: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#111",
    padding: 4,
    borderRadius: 10,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: Colors.normalText,
  },

  tabText: { color: Colors.menuText, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#000", fontWeight: "700" },

  label: {
    color: Colors.menuText,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 4,
    marginTop: 8,
  },

  inputIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.Border,
    gap: 8,
  },

  inputFlex: {
    flex: 1,
    color: Colors.normalText,
  },

  paymentRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },

  paymentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.Border,
    alignItems: "center",
  },

  paymentOptionActive: {
    backgroundColor: Colors.normalText,
  },

  paymentText: { color: Colors.menuText, fontWeight: "500" },
  paymentTextActive: { color: "#000", fontWeight: "700" },

  button: {
    backgroundColor: Colors.normalText,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: { color: "#000", fontWeight: "700", fontSize: 15 },

  cancelButton: { paddingVertical: 12, alignItems: "center" },

  cancelText: { color: Colors.menuText, fontSize: 14 },

  notesInput: {
    backgroundColor: "#121212",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 90,
    color: Colors.normalText,
    marginBottom: 12,
    textAlignVertical: "top",
  },

  dropdown: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dropdownText: {
    color: Colors.normalText,
  },

  inputIconFocused: {
    borderColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});
