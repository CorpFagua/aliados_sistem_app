import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useAuth } from "@/providers/AuthProvider"
import OrdersMenu from "./OrdersMenu"

export default function CoordinatorHome() {
  const { logout, session } = useAuth()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Bienvenido, {session?.user.email}
        </Text>
      </View>

      {/* Main Content - OrdersMenu */}
      <View style={styles.content}>
        <OrdersMenu />
      </View>

      {/* Footer with logout */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={logout}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563EB',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  content: {
    flex: 1,
  },
  logoutButton: {
    padding: 15,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    margin: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
})
