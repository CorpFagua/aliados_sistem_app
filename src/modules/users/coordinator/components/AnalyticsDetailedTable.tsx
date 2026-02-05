// src/modules/users/coordinator/components/AnalyticsDetailedTable.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from "react-native";
import { Colors } from "@/constans/colors";
import { DetailedService } from "@/services/analytics";

interface AnalyticsDetailedTableProps {
  services: DetailedService[];
  onDownload?: (data: DetailedService[]) => void;
}

export default function AnalyticsDetailedTable({
  services,
  onDownload,
}: AnalyticsDetailedTableProps) {
  const handleDownload = async () => {
    if (!onDownload) return;

    try {
      // Crear CSV
      const headers = [
        "Tienda",
        "Admin Tienda",
        "Tipo Servicio",
        "Domiciliario",
        "Teléfono",
        "Zona",
        "Precio",
        "Precio Domiciliario",
        "Estado",
        "Fecha Completado",
      ];

      const rows = services.map((svc) => [
        svc.storeName,
        svc.storeAdmin,
        svc.serviceType || "domicilio",
        svc.deliveryName,
        svc.deliveryPhone || "-",
        svc.zoneName,
        svc.price.toString(),
        svc.priceDeliverySrv.toString(),
        svc.status,
        svc.completedAt ? new Date(svc.completedAt).toLocaleDateString() : "-",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      let message = "Datos de Servicios:\n\n";
      message += csvContent.substring(0, 500) + "...";

      if (Platform.OS === "web") {
        // Para web, descargar como archivo
        const element = document.createElement("a");
        const file = new Blob([csvContent], { type: "text/csv" });
        element.href = URL.createObjectURL(file);
        element.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        // Para móvil, usar Share
        await Share.share({
          message,
          title: "Descargar Servicios",
        });
      }

      onDownload(services);
    } catch (err) {
      console.error("Error downloading:", err);
    }
  };

  if (services.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No hay servicios para mostrar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detalles de Servicios</Text>
        {onDownload && (
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownload}
          >
            <Text style={styles.downloadBtnText}>⬇️ Descargar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tableScroll}
      >
        <View style={styles.table}>
          {/* Headers */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader, { width: 100 }]}>
              Tienda
            </Text>
            <Text style={[styles.tableCell, styles.tableHeader, { width: 80 }]}>
              Tipo
            </Text>
            <Text style={[styles.tableCell, styles.tableHeader, { width: 100 }]}>
              Domiciliario
            </Text>
            <Text style={[styles.tableCell, styles.tableHeader, { width: 80 }]}>
              Zona
            </Text>
            <Text style={[styles.tableCell, styles.tableHeader, { width: 70 }]}>
              Precio
            </Text>
            <Text style={[styles.tableCell, styles.tableHeader, { width: 70 }]}>
              Dom $
            </Text>
            <Text style={[styles.tableCell, styles.tableHeader, { width: 70 }]}>
              Estado
            </Text>
          </View>

          {/* Rows */}
          {services.map((svc, idx) => (
            <View key={svc.serviceId} style={[styles.tableRow, idx % 2 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, { width: 100 }]} numberOfLines={1}>
                {svc.storeName}
              </Text>
              <Text style={[styles.tableCell, { width: 80 }]} numberOfLines={1}>
                {svc.serviceType || "domicilio"}
              </Text>
              <Text style={[styles.tableCell, { width: 100 }]} numberOfLines={1}>
                {svc.deliveryName}
              </Text>
              <Text style={[styles.tableCell, { width: 80 }]} numberOfLines={1}>
                {svc.zoneName}
              </Text>
              <Text style={[styles.tableCell, { width: 70 }]}>
                ${svc.price.toFixed(0)}
              </Text>
              <Text style={[styles.tableCell, { width: 70 }]}>
                ${svc.priceDeliverySrv.toFixed(0)}
              </Text>
              <Text style={[styles.tableCell, { width: 70 }]} numberOfLines={1}>
                {svc.status}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: Colors.normalText,
    fontSize: 16,
    fontWeight: "bold",
  },
  downloadBtn: {
    backgroundColor: Colors.activeMenuText,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadBtnText: {
    color: Colors.Background,
    fontSize: 12,
    fontWeight: "600",
  },
  tableScroll: {
    borderRadius: 8,
    overflow: "hidden",
  },
  table: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    paddingVertical: 8,
  },
  tableRowAlt: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  tableCell: {
    paddingHorizontal: 8,
    color: Colors.menuText,
    fontSize: 11,
    textAlignVertical: "center",
  },
  tableHeader: {
    color: Colors.activeMenuText,
    fontWeight: "bold",
    backgroundColor: "rgba(244, 197, 66, 0.1)",
  },
  empty: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.menuText,
    fontSize: 14,
  },
});
