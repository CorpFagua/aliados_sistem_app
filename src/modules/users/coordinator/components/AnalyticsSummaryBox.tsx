import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {Colors} from "@/constans/colors";

interface AnalyticsSummaryBoxProps {
  totalServices: number;
}

export default function AnalyticsSummaryBox({
  totalServices,
}: AnalyticsSummaryBoxProps) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.label}>Total de Servicios</Text>
        <Text style={styles.value}>{totalServices}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  box: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 8,
  },
  value: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.activeMenuText,
  },
});
