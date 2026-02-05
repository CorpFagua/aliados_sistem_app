import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constans/colors";
import { StoreStat } from "@/services/analytics";
import { formatCurrency } from "@/utils/formatters";

interface StoreListProps {
  storeStats: StoreStat[];
}

export default function StoreList({ storeStats }: StoreListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiendas</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {storeStats.map((store) => (
          <View key={store.storeId} style={styles.card}>
            <Text style={styles.name}>{store.storeName}</Text>
            {store.serviceType && (
              <Text style={styles.serviceType}>Tipo: {store.serviceType}</Text>
            )}
            {store.storeAdmin && (
              <Text style={styles.admin}>Gerente: {store.storeAdmin}</Text>
            )}

            {/* Cantidad de servicios y porcentaje */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Servicios:</Text>
              <Text style={styles.statValue}>{store.totalServices}</Text>
              <Text style={styles.percentage}>
                ({store.percentageOfTotal.toFixed(1)}%)
              </Text>
            </View>

            {/* Ganancias */}
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cobrado:</Text>
              <Text style={styles.earned}>
                {formatCurrency(store.totalEarnings)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>A Domiciliarios:</Text>
              <Text style={styles.owed}>
                {formatCurrency(store.totalOwed)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Ganancias:</Text>
              <Text style={styles.profit}>
                {formatCurrency(store.netProfit)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 12,
  },
  scrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    width: 280,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f59e0b",
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 11,
    color: "#f59e0b",
    marginBottom: 4,
    fontStyle: "italic",
  },
  admin: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.menuText,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.activeMenuText,
  },
  percentage: {
    fontSize: 11,
    color: Colors.menuText,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.menuText,
    marginVertical: 8,
    opacity: 0.3,
  },
  earned: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.activeMenuText,
  },
  owed: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  profit: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f59e0b",
  },
});
