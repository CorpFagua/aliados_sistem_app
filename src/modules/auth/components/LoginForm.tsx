import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Login con:", email, password);
    // Aquí luego conectamos con supabase.auth.signInWithPassword()
  };

  return (
    <View style={styles.wrapper}>
      {/* Logo */}
      <Image 
        source={require("../../../../assets/images/logo.png")} 
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Campo Email */}
      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={styles.input}
        placeholder="ejemplo@correo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Campo Contraseña */}
      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Botón */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 400, // ✅ esto asegura que en web no se expanda demasiado
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 30,
  },
  label: {
    alignSelf: "flex-start",
    fontWeight: "600",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: Platform.OS === "web" ? 12 : 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#FBCB0A", // amarillo según tu branding
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
