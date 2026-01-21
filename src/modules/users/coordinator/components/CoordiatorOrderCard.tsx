import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constans/colors";
import { Service } from "@/models/service";
import {
  getServiceType,
  getServiceTypeColor,
  getServiceTypeLabel,
  getServiceTypeIcon,
} from "@/utils/serviceTypeUtils";

interface Props {
  pedido: Service;
  onPress: () => void;
}

export default function CoordinatorOrderCard({ pedido, onPress }: Props) {
  // 🕒 Calcular minutos desde creación
  const elapsedMinutes = useMemo(() => {
    const diffMs = Date.now() - new Date(pedido.createdAt).getTime();
    return Math.floor(diffMs / 60000);
  }, [pedido.createdAt]);

  // 🚦 Semáforo visual
  const getTimeColor = () => {
    if (elapsedMinutes < 10) return "#4CAF50"; // verde
    if (elapsedMinutes < 20) return "#FFC107"; // amarillo
    return "#F44336"; // rojo
  };

  // 📦 Tipo de servicio
  const serviceType = useMemo(() => getServiceType(pedido), [pedido.typeId, pedido.pickup]);
  const serviceTypeColor = getServiceTypeColor(serviceType);
  const serviceTypeLabel = getServiceTypeLabel(serviceType);
  const serviceTypeIcon = getServiceTypeIcon(serviceType);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ marginBottom: 14 }}>
      <View style={styles.card}>
        {/* ✨ Brillo sutil */}
        <LinearGradient
          colors={["rgba(255,255,255,0.05)", "transparent", "rgba(0,0,0,0.15)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header con tienda/recogida, tipo de servicio y tiempo */}
        <View style={styles.headerRow}>
          <View style={styles.leftHeader}>
            {serviceType === "paqueteria" ? (
              // Para paquetería mostrar dirección de recogida y últimos 4 dígitos del ID
              <>
                <View style={styles.paqueteriaHeader}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {pedido.pickup || "Sin recogida"}
                  </Text>
                  <Text style={styles.idBadge}>#{pedido.id.slice(-4)}</Text>
                </View>
              </>
            ) : (
              // Para domicilio mostrar nombre del perfil tienda (tienda norte, tienda sur, etc)
              <Text style={styles.storeName}>{pedido.profileStoreName || "Tienda desconocida"}</Text>
            )}

            {/* Badge de tipo de servicio */}
            <View
              style={[
                styles.serviceTypeBadge,
                { backgroundColor: serviceTypeColor + "22", borderColor: serviceTypeColor + "55" },
              ]}
            >
              <Ionicons name={serviceTypeIcon as any} size={12} color={serviceTypeColor} />
              <Text style={[styles.serviceTypeText, { color: serviceTypeColor }]}>
                {serviceTypeLabel}
              </Text>
            </View>
          </View>

          <View style={[styles.timeBadge, { backgroundColor: getTimeColor() + "22" }]}>
            <Ionicons name="time-outline" size={14} color={getTimeColor()} />
            <Text style={[styles.timeText, { color: getTimeColor() }]}>
              {elapsedMinutes} min
            </Text>
          </View>
        </View>

        {/* Dirección */}
        <Text style={styles.destinationText} numberOfLines={2}>
          <Ionicons name="location-outline" size={14} color={Colors.menuText} />{" "}
          {pedido.destination || "Sin dirección"}
        </Text>

        {/* Info de zona y domiciliario - solo mostrar en domicilios */}
        {serviceType !== "paqueteria" && (
          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Ionicons name="map-outline" size={13} color={Colors.menuText} />
              <Text style={styles.infoText}>
                {pedido.zoneName ? pedido.zoneName : "Sin zona"}
              </Text>
            </View>

            <View style={styles.infoBadge}>
              <Ionicons name="person-outline" size={13} color={Colors.menuText} />
              <Text style={styles.infoText}>
                {pedido.assignedDeliveryName
                  ? pedido.assignedDeliveryName
                  : "Sin domiciliario"}
              </Text>
            </View>
          </View>
        )}

        {/* Monto */}
        {pedido.amount > 0 && (
          <Text style={styles.amountText}>
            <Ionicons name="cash-outline" size={14} color={Colors.gradientStart} /> $
            {pedido.amount.toLocaleString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  leftHeader: {
    flex: 1,
    gap: 4,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
  },
  paqueteriaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  idBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gradientStart,
    backgroundColor: Colors.gradientStart + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  serviceTypeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
    minWidth: 70,
    justifyContent: "center",
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  destinationText: {
    fontSize: 14,
    color: Colors.normalText,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.menuText,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gradientStart,
    marginTop: 4,
  },
});
