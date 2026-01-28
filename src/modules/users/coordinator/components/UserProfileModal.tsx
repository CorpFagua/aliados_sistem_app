import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Switch,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchUserById, updateUser } from "@/services/users";
import { User } from "@/models/user";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSave?: (user: User) => void;
}

export default function UserProfileModal({
  visible,
  userId,
  onClose,
  onSave,
}: Props) {
  const { session } = useAuth();
  const token = session?.access_token || "";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Campos editables
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    isActive: true,
  });

  useEffect(() => {
    if (visible && userId) {
      loadUser();
    }
  }, [visible, userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await fetchUserById(userId, token);
      setUser(data);
      setForm({
        name: data.name,
        phone: data.phone || "",
        address: data.address || "",
        isActive: data.isActive,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
      Toast.show({
        type: "error",
        text1: "Error al cargar usuario",
        text2: "No se pudo obtener la información.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Campo requerido",
        text2: "El nombre es obligatorio.",
        position: "top",
      });
      return;
    }

    try {
      setLoading(true);
      const updated = await updateUser(userId, form, token);
      setUser(updated);
      Toast.show({
        type: "success",
        text1: "Usuario actualizado",
        text2: `"${updated.name}" fue actualizado correctamente.`,
        position: "top",
      });
      setIsEditing(false);
      onSave?.(updated);
    } catch (err) {
      console.error("❌ Error actualizando usuario:", err);
      Toast.show({
        type: "error",
        text1: "Error al actualizar",
        text2: "No se pudo guardar los cambios.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name,
        phone: user.phone || "",
        address: user.address || "",
        isActive: user.isActive,
      });
    }
    setIsEditing(false);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Detalles del usuario</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.normalText}
                  />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator
                    size="large"
                    color={Colors.activeMenuText}
                  />
                </View>
              ) : user ? (
                <ScrollView
                  style={styles.content}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* 🎨 Card Header con Avatar */}
                  <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                      <Ionicons
                        name="person-circle"
                        size={80}
                        color={Colors.activeMenuText}
                      />
                    </View>
                    <Text style={styles.userName}>{user.name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {user.role === "super_admin"
                          ? "Super Admin"
                          : user.role === "coordinator"
                          ? "Coordinador"
                          : user.role === "store"
                          ? "Tienda"
                          : user.role === "delivery"
                          ? "Domiciliario"
                          : user.role}
                      </Text>
                    </View>
                  </View>

                  {/* 📧 Información crítica: Email (siempre visible, no editable) */}
                  <View style={styles.criticalSection}>
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <Ionicons
                          name="mail"
                          size={20}
                          color={Colors.activeMenuText}
                        />
                        <Text style={styles.criticalLabel}>Correo electrónico</Text>
                      </View>
                      <View style={styles.emailBox}>
                        <Text style={styles.emailText}>{user.email || "No registrado"}</Text>
                        <Ionicons
                          name="shield-checkmark"
                          size={16}
                          color={Colors.success}
                          style={{ marginLeft: 8 }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* 📋 Información de sistema */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={Colors.activeMenuText}
                      />
                      <Text style={styles.sectionTitle}>Información del sistema</Text>
                    </View>

                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>ID</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                          {user.id}
                        </Text>
                      </View>

                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Creado</Text>
                        <Text style={styles.infoValue}>
                          {new Date(user.createdAt).toLocaleDateString("es-CO")}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 👤 Datos personales (editables) */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderLeft}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={Colors.activeMenuText}
                        />
                        <Text style={styles.sectionTitle}>Datos personales</Text>
                      </View>
                      {!isEditing && (
                        <Pressable
                          onPress={() => setIsEditing(true)}
                          style={styles.editButton}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={Colors.activeMenuText}
                          />
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Nombre completo</Text>
                      <TextInput
                        style={[
                          styles.input,
                          !isEditing && styles.inputDisabled,
                        ]}
                        placeholder="Nombre"
                        placeholderTextColor={Colors.menuText}
                        value={form.name}
                        onChangeText={(text) => handleChange("name", text)}
                        editable={isEditing}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Teléfono</Text>
                      <TextInput
                        style={[
                          styles.input,
                          !isEditing && styles.inputDisabled,
                        ]}
                        placeholder="Teléfono"
                        placeholderTextColor={Colors.menuText}
                        value={form.phone}
                        onChangeText={(text) => handleChange("phone", text)}
                        editable={isEditing}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Dirección</Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.textAreaInput,
                          !isEditing && styles.inputDisabled,
                        ]}
                        placeholder="Dirección"
                        placeholderTextColor={Colors.menuText}
                        value={form.address}
                        onChangeText={(text) => handleChange("address", text)}
                        editable={isEditing}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    {/* Estado */}
                    <View style={styles.switchGroup}>
                      <View style={styles.switchLabel}>
                        <Ionicons
                          name={form.isActive ? "checkmark-circle" : "close-circle"}
                          size={18}
                          color={form.isActive ? Colors.success : Colors.error}
                        />
                        <Text style={styles.label}>Estado de cuenta</Text>
                      </View>
                      <View style={styles.switchContainer}>
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: form.isActive
                                ? Colors.success
                                : Colors.error,
                            },
                          ]}
                        >
                          {form.isActive ? "Activo" : "Inactivo"}
                        </Text>
                        <Switch
                          value={form.isActive}
                          onValueChange={(value) =>
                            handleChange("isActive", value)
                          }
                          disabled={!isEditing}
                          trackColor={{
                            false: Colors.error,
                            true: Colors.success,
                          }}
                          thumbColor={"#fff"}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.center}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color={Colors.error}
                  />
                  <Text style={{ color: Colors.menuText, marginTop: 12 }}>
                    No se encontró el usuario.
                  </Text>
                </View>
              )}

              {/* Acciones */}
              {user && isEditing && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancel}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.Background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    color: Colors.normalText,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },

  // 🎨 Avatar Section
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 12,
  },
  avatarCircle: {
    marginBottom: 12,
    shadowColor: Colors.activeMenuText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  userName: {
    color: Colors.normalText,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  roleBadge: {
    backgroundColor: Colors.activeMenuBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.activeMenuText,
  },
  roleBadgeText: {
    color: Colors.activeMenuText,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // 📧 Email Section (Critical Info)
  criticalSection: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.activeMenuText,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  criticalLabel: {
    color: Colors.activeMenuText,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  emailBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.Background,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emailText: {
    color: Colors.normalText,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  // 📋 Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionTitle: {
    color: Colors.normalText,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  editButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuBackground,
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Colors.activeMenuBackground,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  infoLabel: {
    color: Colors.menuText,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    color: Colors.normalText,
    fontSize: 12,
    fontWeight: "600",
  },

  // Input Fields
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: Colors.menuText,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: Colors.activeMenuBackground,
    borderWidth: 1,
    borderColor: Colors.Border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.normalText,
    fontSize: 14,
    fontWeight: "500",
  },
  textAreaInput: {
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputDisabled: {
    backgroundColor: Colors.Background,
    opacity: 0.6,
  },

  // Switch
  switchGroup: {
    marginBottom: 14,
  },
  switchLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.activeMenuBackground,
    borderWidth: 1,
    borderColor: Colors.Border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: Colors.activeMenuBackground,
    borderColor: Colors.Border,
  },
  cancelButtonText: {
    color: Colors.normalText,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: Colors.activeMenuText,
    borderColor: Colors.activeMenuText,
  },
  saveButtonText: {
    color: Colors.Background,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
