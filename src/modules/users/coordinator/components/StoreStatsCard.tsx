// src/modules/users/coordinator/components/StoreStatsCard.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Colors } from "@/constans/colors";
import { StoreStat } from "@/services/analytics";

interface StoreStatsCardProps {
  stats: StoreStat[];
}

export default function StoreStatsCard({ stats }: StoreStatsCardProps) {
  const maxServices = Math.max(...stats.map((s) => s.totalServices), 1);

  const renderItem = ({ item }: { item: StoreStat }) => {
    const barWidth = (item.totalServices / maxServices) * 100;

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.storeName}</Text>
            <Text style={styles.itemAdmin}>{item.storeAdmin || "N/A"}</Text>
          </View>
          <Text style={styles.itemServices}>{item.totalServices} svc</Text>
        </View>

        {/* Bar Chart */}
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              { width: `${barWidth}%`, backgroundColor: "#f59e0b" },
            ]}
          />
        </View>

        {/* Stats */}
        <View style={styles.itemStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Recibido</Text>
            <Text style={styles.statValue}>
              ${item.totalEarnings.toFixed(0)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Debe a dom.</Text>
            <Text style={[styles.statValue, { color: "#ff6b6b" }]}>
              ${item.totalOwed.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (stats.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No hay datos de tiendas</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiendas</Text>
      <FlatList
        scrollEnabled={false}
        data={stats}
        renderItem={renderItem}
        keyExtractor={(item) => item.storeId}
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
  itemAdmin: {
    color: Colors.menuText,
    fontSize: 11,
    marginTop: 2,
  },
  itemServices: {
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
