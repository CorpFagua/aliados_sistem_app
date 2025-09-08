import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const TABS = ["Disponibles", "Tomados", "Por recoger"];
const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("Disponibles");

  // 📌 Ejemplo de pedidos
  const pedidos = {
    Disponibles: [
      {
        id: "1",
        cliente: "Carlos Pérez",
        direccion: "Cra 15 #45-22",
        detalle: "2 Hamburguesas + 1 Gaseosa",
      },
      {
        id: "2",
        cliente: "María López",
        direccion: "Cl 80 #30-10",
        detalle: "Pizza grande de peperoni",
      },
    ],
    Tomados: [
      {
        id: "3",
        cliente: "Juan Gómez",
        direccion: "Cra 20 #12-33",
        detalle: "Ensalada + Jugo natural",
      },
    ],
    "Por recoger": [
      {
        id: "4",
        cliente: "Ana Torres",
        direccion: "Cl 50 #22-15",
        detalle: "3 Perros calientes",
      },
    ],
  };

  return (
    <View style={styles.container} >
      {/* 📌 Tabs superiores */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 📌 Contenido dinámico */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLargeScreen && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {pedidos[activeTab].map((pedido) => (
          <View key={pedido.id} style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <Ionicons
                name="fast-food-outline"
                size={22}
                color={Colors.iconActive}
              />
              <Text style={styles.cardTitle}>Pedido #{pedido.id}</Text>
            </View>

            {/* Info */}
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>
                <Text style={styles.cardLabel}>Cliente: </Text>
                {pedido.cliente}
              </Text>
              <Text style={styles.cardText}>
                <Text style={styles.cardLabel}>Dirección: </Text>
                {pedido.direccion}
              </Text>
              <Text style={styles.cardText}>
                <Text style={styles.cardLabel}>Detalle: </Text>
                {pedido.detalle}
              </Text>
            </View>

            {/* Acciones */}
            <TouchableOpacity style={styles.chatButton}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="#000"
              />
              <Text style={styles.chatText}>Chatear</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* 📌 Botón flotante para crear pedido */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#000" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },

// Tabs superiores
tabsWrapper: {

  paddingTop: 10,
  paddingBottom: 12,
  backgroundColor: Colors.Background,
},

tabs: {
  flexDirection: "row",
  backgroundColor: "#1C1C1E",
  borderRadius: 30,
  padding: 4,
  justifyContent: "space-between",

  // 🔥 Flotante con sombra
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 6,
},


  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "transparent",
  },

  activeTabButton: {
    backgroundColor: Colors.iconActive, // pill resaltado
  },

  tabText: {
    color: Colors.menuText,
    fontSize: 14,
    fontWeight: "500",
  },

  activeTabText: {
    color: "#000",
    fontWeight: "700",
  },

  // Scroll content
  scrollContent: {
    paddingBottom: 100, // más espacio para no tapar el FAB
  },
  scrollContentDesktop: {
    paddingHorizontal: 20,
  },

  // Card de pedidos
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.normalText,
  },
  cardBody: {
    marginBottom: 12,
  },
  cardLabel: {
    fontWeight: "600",
    color: Colors.menuText,
  },
  cardText: {
    color: Colors.normalText,
    marginBottom: 6,
    fontSize: 14,
  },

  // Chat button
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.iconActive,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  chatText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  fabGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
