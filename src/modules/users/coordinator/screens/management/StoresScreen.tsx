// src/screens/stores/StoresScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchStores, deleteStore } from "@/services/stores";
import { Store } from "@/models/store";
import Toast from "react-native-toast-message";
import StoreFormModal from "../../components/StoreFormModal";
import DeleteStoreModal from "../../components/DeleteStoreModal";
import StoreDetailScreen from "./StoresScreenDetail"; // 👈 importar tu componente existente

export default function StoresScreen() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { session } = useAuth();
  const token = session?.access_token || "";

  useEffect(() => {
    if (token) loadStores();
  }, [token]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await fetchStores(token);
      setStores(data);
    } catch (err) {
      console.error("❌ Error cargando tiendas:", err);
      Toast.show({
        type: "error",
        text1: "Error al cargar",
        text2: "No se pudieron obtener las tiendas.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (store: Store) => {
    // 🔥 Abrir el modal de confirmación
    setStoreToDelete(store);
  };

  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;

    setIsDeleting(true);

    try {
      await deleteStore(storeToDelete.id, token);
      
      // Eliminar de la lista local
      setStores((prev) => prev.filter((s) => s.id !== storeToDelete.id));
      
      Toast.show({
        type: "success",
        text1: "Tienda eliminada",
        text2: `"${storeToDelete.name}" fue eliminada correctamente.`,
        position: "top",
      });

      // Cerrar modal
      setStoreToDelete(null);
    } catch (err) {
      console.error("❌ Error eliminando tienda:", err);
      Toast.show({
        type: "error",
        text1: "Error al eliminar",
        text2: "No se pudo eliminar la tienda.",
        position: "top",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 👇 cuando toque una tienda, cambia el id seleccionado
  const handleOpenDetail = (storeId: string) => {
    setSelectedStoreId(storeId);
  };

  // 👇 volver al listado
  const handleBack = () => {
    setSelectedStoreId(null);
  };

  // 🟩 Si hay tienda seleccionada, mostrar StoreDetailScreen como componente hijo
  if (selectedStoreId) {
    return (
      <StoreDetailScreen
        id={selectedStoreId}
        onBack={handleBack} // ✅ lo agregamos para poder volver al listado
      />
    );
  }

  // 🟦 Vista de listado
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiendas</Text>
      <Text style={styles.subtitle}>Administra las tiendas de tu sucursal</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.normalText} />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => handleOpenDetail(item.id)} // 👈 abre componente
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>
                  Tipo: {item.type === "credito" ? "Crédito" : "Efectivo"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={{ padding: 8 }}
              >
                <Ionicons name="trash-outline" size={22} color="red" />
              </TouchableOpacity>
            </Pressable>
          )}
        />
      )}

      {/* 🟢 Botón flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowForm(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* 🔥 Modal para confirmar eliminación */}
      <DeleteStoreModal
        visible={!!storeToDelete}
        store={storeToDelete}
        onClose={() => setStoreToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Modal para crear tienda */}
      <StoreFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={() => {
          setShowForm(false);
          loadStores(); // 🔁 recarga lista después de crear
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.Background, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.normalText, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.menuText, marginBottom: 12 },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cardTitle: { fontSize: 16, color: Colors.normalText, fontWeight: "600" },
  cardSubtitle: { fontSize: 13, color: Colors.menuText, marginTop: 2 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: Colors.normalText,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
