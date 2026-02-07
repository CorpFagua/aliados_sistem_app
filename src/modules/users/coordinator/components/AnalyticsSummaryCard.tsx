// src/modules/users/coordinator/components/AnalyticsSummaryCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constans/colors";

interface AnalyticsSummaryCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon?: React.ReactNode;
  color?: string;
}

export default function AnalyticsSummaryCard({
  label,
  value,
  subLabel,
  icon,
  color = Colors.activeMenuText,
}: AnalyticsSummaryCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: Colors.menuText,
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  subLabel: {
    color: Colors.menuText,
    fontSize: 11,
    marginTop: 4,
  },
});
