// src/screens/stores/StoreDetailScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchStoreWithProfiles, updateStore, toggleStoreStatus } from "@/services/stores";
import { Store } from "@/models/store";
import Toast from "react-native-toast-message";
import StoreFormModal from "../../components/StoreFormModal";
import UserFormModal from "../../components/UserFormModal";
import UserProfileModal from "../../components/UserProfileModal";

// 🟩 ahora recibe props desde StoresScreen
export default function StoreDetailScreen({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { session } = useAuth();
  const token = session?.access_token || "";

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    if (token && id) loadStore();
  }, [id, token]);

  const loadStore = async () => {
    try {
      setLoading(true);
      const data = await fetchStoreWithProfiles(id, token);
      setStore(data);
    } catch (err) {
      console.error("❌ Error cargando tienda:", err);
      Toast.show({
        type: "error",
        text1: "Error al cargar tienda",
        text2: "No se pudo obtener la información.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStore = (updated: Store) => {
    // El modal envía el Store actualizado directamente
    setStore(updated);
    Toast.show({
      type: "success",
      text1: "Tienda actualizada",
      text2: `"${updated.name}" se actualizó correctamente.`,
      position: "top",
    });
  };

  const handleToggleStatus = async () => {
    if (!store) return;
    try {
      const newStatus = !store.isActive;
      const updated = await toggleStoreStatus(store.id, token);
      setStore(updated);
      Toast.show({
        type: "success",
        text1: newStatus ? "Tienda activada" : "Tienda desactivada",
        text2: newStatus
          ? "La tienda y sus usuarios han sido activados"
          : "La tienda y sus usuarios han sido desactivados. Las sesiones activas se cerraron.",
        position: "top",
      });
    } catch (err) {
      console.error("❌ Error cambiando estado de tienda:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo cambiar el estado de la tienda",
        position: "top",
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.normalText} />
        <Text style={{ color: Colors.menuText, marginTop: 10 }}>
          Cargando tienda...
        </Text>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.normalText} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <Text style={{ color: Colors.menuText }}>
          No se encontró la tienda.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.normalText} />
          </TouchableOpacity>
          <Text style={styles.title}>{store.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tarjeta informativa */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Estado:</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: store.isActive ? "#4CAF50" : "#f44336" },
              ]}
            />
            <Text style={[styles.value, { fontWeight: "600" }]}>
              {store.isActive ? "Activa" : "Inactiva"}
            </Text>
          </View>

          <Text style={styles.label}>Tipo:</Text>
          <Text style={styles.value}>
            {store.type === "credito" ? "Crédito" : "Efectivo"}
          </Text>

          <Text style={styles.label}>Email Administrador:</Text>
          <Text style={styles.value}>
            {store.adminEmail || "No asignado"}
          </Text>

          <Text style={styles.label}>Fecha creación:</Text>
          <Text style={styles.value}>
            {new Date(store.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Botón de activar/desactivar (prominente) */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: store.isActive ? "#f44336" : "#4CAF50" },
          ]}
          onPress={handleToggleStatus}
        >
          <Ionicons
            name={store.isActive ? "close-circle" : "checkmark-circle"}
            size={22}
            color="#FFF"
          />
          <Text style={styles.toggleButtonText}>
            {store.isActive ? "Desactivar tienda" : "Activar tienda"}
          </Text>
        </TouchableOpacity>

        {/* Botones de acción */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.whiteButton]}
            onPress={() => setShowEdit(true)}
          >
            <Ionicons name="create-outline" size={22} color="#000" />
            <Text style={styles.darkText}>Editar tienda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whiteButton]}
            onPress={() => setShowUserForm(true)}
          >
            <Ionicons name="person-add-outline" size={22} color="#000" />
            <Text style={styles.darkText}>Agregar usuario</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de perfiles */}
        <Text style={styles.sectionTitle}>Usuarios asociados</Text>

        {store.profiles && store.profiles.length > 0 ? (
          <FlatList
            data={store.profiles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => {
                  setSelectedUserId(item.id);
                  setShowUserProfile(true);
                }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={30}
                  color={Colors.normalText}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userPhone}>
                    {item.phone || "Sin teléfono"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        ) : (
          <Text style={styles.emptyText}>No hay usuarios asociados aún.</Text>
        )}
      </ScrollView>

      {/* 🟦 Modal editar tienda */}
      <StoreFormModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        store={store}
        onSave={handleUpdateStore}
      />

      {/* 🟩 Modal crear usuario */}
      <UserFormModal
        visible={showUserForm}
        storeId={store.id}
        role="store"
        onClose={() => setShowUserForm(false)}
        onSave={() => {
          setShowUserForm(false);
          loadStore(); // refrescar lista de usuarios
        }}
      />

      {/* 🟪 Modal ver/editar perfil usuario */}
      <UserProfileModal
        visible={showUserProfile}
        userId={selectedUserId}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUserId("");
        }}
        onSave={() => {
          loadStore(); // refrescar lista de usuarios
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: Colors.normalText,
    fontSize: 20,
    fontWeight: "600",
  },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backText: { marginLeft: 6, color: Colors.normalText, fontSize: 15 },
  infoCard: {
    backgroundColor: Colors.activeMenuBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 20,
  },
  label: { color: Colors.menuText, fontSize: 13, marginTop: 4 },
  value: { color: Colors.normalText, fontSize: 15, fontWeight: "500" },

  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },

  toggleButton: {
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    marginHorizontal: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  whiteButton: {
    backgroundColor: "#FFF",
  },
  darkText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  sectionTitle: {
    color: Colors.normalText,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.activeMenuBackground,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 8,
  },
  userName: { color: Colors.normalText, fontSize: 15, fontWeight: "500" },
  userPhone: { color: Colors.menuText, fontSize: 13 },
  emptyText: { color: Colors.menuText, textAlign: "center", marginTop: 20 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.Background,
  },
});
