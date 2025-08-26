import { View, Text, Button } from "react-native"
import { useAuth } from "@/providers/AuthProvider"

export default function AdminHome() {
  const { logout, session } = useAuth()

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color:"white"}}>Bienvenido  Admin {session?.user.email}</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  )
}
