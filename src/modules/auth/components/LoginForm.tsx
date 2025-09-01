import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native"
import { useAuth } from "@/providers/AuthProvider"

export default function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await login(email, password);
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  }

  return (
    <View style={styles.content}>
      <Image
        source={require("../../../../assets/images/LOGO.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Inicia sesión</Text>
      <Text style={styles.phrase}>
        Corriendo por tu tranquilidad.
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Ingresando..." : "Ingresar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logo: {
    width: 250,
    height: 180,
    marginBottom: 5,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  phrase: {
    textAlign: "center",
    color: "#fff",
    fontSize: 13,
    marginBottom: 28,
    opacity: 0.5,
    fontStyle: "italic",
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 350,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#222",
    fontSize: 16,
    color: "#fff",
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  buttonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
