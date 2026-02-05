import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constans/colors";
import { DeliveryPersonStat } from "@/services/analytics";
import { formatCurrency } from "@/utils/formatters";

interface DeliveryPersonListProps {
  deliveryStats: DeliveryPersonStat[];
}

export default function DeliveryPersonList({
  deliveryStats,
}: DeliveryPersonListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Domiciliarios</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {deliveryStats.map((delivery) => (
          <View key={delivery.deliveryId} style={styles.card}>
            <Text style={styles.name}>{delivery.deliveryName}</Text>
            {delivery.deliveryPhone && (
              <Text style={styles.phone}>{delivery.deliveryPhone}</Text>
            )}

            {/* Cantidad y porcentaje */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Domicilios:</Text>
              <Text style={styles.statValue}>{delivery.totalDeliveries}</Text>
              <Text style={styles.percentage}>
                ({delivery.percentageOfTotal.toFixed(1)}%)
              </Text>
            </View>

            {/* Ganancias */}
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cobrado:</Text>
              <Text style={styles.earned}>
                {formatCurrency(delivery.totalEarnings)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Adeudado:</Text>
              <Text style={styles.owed}>
                {formatCurrency(delivery.totalOwed)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Ganancia:</Text>
              <Text style={styles.profit}>
                {formatCurrency(delivery.netProfit)}
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
    borderLeftColor: Colors.activeMenuText,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.activeMenuText,
    marginBottom: 4,
  },
  phone: {
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
    color: Colors.activeMenuText,
  },
});
