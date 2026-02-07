import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constans/colors";
import { formatCurrency } from "@/utils/formatters";

interface ProfitSummaryProps {
  totalEarnings: number;
  totalOwed: number;
  netProfit: number;
}

export default function ProfitSummary({
  totalEarnings,
  totalOwed,
  netProfit,
}: ProfitSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen de Ganancias</Text>

      <View style={styles.grid}>
        {/* Cobrado */}
        <View style={styles.card}>
          <Text style={styles.label}>Lo Cobrado</Text>
          <Text style={styles.valueEarned}>
            {formatCurrency(totalEarnings)}
          </Text>
          <Text style={styles.subtext}>(price)</Text>
        </View>

        {/* Adeudado */}
        <View style={styles.card}>
          <Text style={styles.label}>Adeudado</Text>
          <Text style={styles.valueOwed}>{formatCurrency(totalOwed)}</Text>
          <Text style={styles.subtext}>(price_delivery)</Text>
        </View>

        {/* Ganancia Neta */}
        <View style={[styles.card, styles.profitCard]}>
          <Text style={styles.label}>Ganancia Neta</Text>
          <Text style={styles.valueProfit}>
            {formatCurrency(netProfit)}
          </Text>
          <Text style={styles.subtext}>
            ({((netProfit / totalEarnings) * 100).toFixed(1)}%)
          </Text>
        </View>
      </View>
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
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: Colors.activeMenuText,
  },
  profitCard: {
    borderLeftColor: "#10b981",
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 8,
    textAlign: "center",
  },
  valueEarned: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.activeMenuText,
    marginBottom: 4,
    textAlign: "center",
  },
  valueOwed: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 4,
    textAlign: "center",
  },
  valueProfit: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
    textAlign: "center",
  },
  subtext: {
    fontSize: 10,
    color: Colors.menuText,
    fontStyle: "italic",
    textAlign: "center",
  },
});
