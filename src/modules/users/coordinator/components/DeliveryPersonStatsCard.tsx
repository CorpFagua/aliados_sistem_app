// src/modules/users/coordinator/components/DeliveryPersonStatsCard.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Colors } from "@/constans/colors";
import { DeliveryPersonStat } from "@/services/analytics";

interface DeliveryPersonStatsCardProps {
  stats: DeliveryPersonStat[];
}

export default function DeliveryPersonStatsCard({
  stats,
}: DeliveryPersonStatsCardProps) {
  const maxEarnings = Math.max(...stats.map((s) => s.totalEarnings), 1);

  const renderItem = ({ item }: { item: DeliveryPersonStat }) => {
    const barWidth = (item.totalEarnings / maxEarnings) * 100;

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.deliveryName}</Text>
            <Text style={styles.itemPhone}>{item.deliveryPhone || "N/A"}</Text>
          </View>
          <Text style={styles.itemCount}>{item.totalDeliveries} env.</Text>
        </View>

        {/* Bar Chart */}
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              { width: `${barWidth}%`, backgroundColor: Colors.activeMenuText },
            ]}
          />
        </View>

        {/* Stats */}
        <View style={styles.itemStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Ganancia</Text>
            <Text style={styles.statValue}>
              ${item.totalEarnings.toFixed(0)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Debe</Text>
            <Text style={[styles.statValue, { color: "#ff6b6b" }]}>
              ${item.totalOwed.toFixed(0)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Neta</Text>
            <Text style={[styles.statValue, { color: Colors.activeMenuText }]}>
              ${item.netProfit.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (stats.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No hay datos de domiciliarios</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Domiciliarios</Text>
      <FlatList
        scrollEnabled={false}
        data={stats}
        renderItem={renderItem}
        keyExtractor={(item) => item.deliveryId}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    paddingVertical: 16,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  title: {
    color: Colors.normalText,
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: Colors.normalText,
    fontSize: 14,
    fontWeight: "600",
  },
  itemPhone: {
    color: Colors.menuText,
    fontSize: 11,
    marginTop: 2,
  },
  itemCount: {
    color: Colors.menuText,
    fontSize: 12,
    fontWeight: "500",
  },
  barContainer: {
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
    marginVertical: 8,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  itemStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    color: Colors.menuText,
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    color: Colors.normalText,
    fontSize: 12,
    fontWeight: "bold",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 16,
  },
  emptyText: {
    color: Colors.menuText,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
