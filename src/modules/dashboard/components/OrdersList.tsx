import { View, Text, StyleSheet } from "react-native";

export default function OrdersList({ section }) {
  const sectionTitles = {
    available: "📦 Pedidos disponibles",
    pickup: "🚲 Pedidos por recoger",
    onRoute: "🛣️ Pedidos en ruta",
    delivered: "✅ Pedidos entregados",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{sectionTitles[section]}</Text>
      <Text style={styles.subtitle}>
        Aquí se mostrarán los pedidos de la sección seleccionada.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 20,
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
