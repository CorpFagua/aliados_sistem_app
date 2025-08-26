import { View, Text, Button } from "react-native"
import { useAuth } from "@/providers/AuthProvider"

export default function DeliveryHome() {
  const { logout, session } = useAuth()

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color:"white"}}>Bienvenido  Delivery {session?.user.email}</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  )
}
