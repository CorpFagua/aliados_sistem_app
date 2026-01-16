import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "../../../../constans/colors";
import DeliveriesListScreen from "./DeliveriesListScreen";
import PaymentRequestsListScreen from "./PaymentRequestsListScreen";

type TabType = "deliveries" | "payments";

export default function PaymentsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("deliveries");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Pagos</Text>
        <Text style={styles.headerSubtitle}>Domiciliarios y Solicitudes</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "deliveries" && styles.activeTab]}
          onPress={() => setActiveTab("deliveries")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "deliveries" && styles.activeTabText,
            ]}
          >
            Domiciliarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "payments" && styles.activeTab]}
          onPress={() => setActiveTab("payments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "payments" && styles.activeTabText,
            ]}
          >
            Solicitudes de Pago
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === "deliveries" && <DeliveriesListScreen />}
        {activeTab === "payments" && <PaymentRequestsListScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    backgroundColor: Colors.gradientStart,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.Background,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.Background,
    marginTop: 4,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.activeMenuBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.menuText + "15",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.activeMenuText,
  },
  tabText: {
    fontSize: 14,
    color: Colors.menuText,
    fontWeight: "600",
  },
  activeTabText: {
    color: Colors.activeMenuText,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
});
