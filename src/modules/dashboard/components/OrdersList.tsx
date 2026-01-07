import { View, Text, StyleSheet } from "react-native";
import { SafeAreaFrameContext, SafeAreaView } from "react-native-safe-area-context";

export default function OrdersList({ section }) {
  const sectionTitles = {
    available: "📦 Pedidos disponibles",
    pickup: "🚲 Pedidos por recoger",
    onRoute: "🛣️ Pedidos en ruta",
    delivered: "✅ Pedidos entregados",
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{sectionTitles[section]}</Text>
      <Text style={styles.subtitle}>
        Aquí se mostrarán los pedidos de la sección seleccionada.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
  },
});
