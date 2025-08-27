import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform, useWindowDimensions } from "react-native"
import { useAuth } from "@/providers/AuthProvider"

export default function LoginForm() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
    } else {
        Alert.alert(title, message, [{ text: 'OK' }]);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Campos requeridos", "Por favor ingresa tu correo y contraseña");
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
    } catch (error: any) {
      
      if (error.message === "Usuario inactivo") {
        showAlert(
          "Cuenta Desactivada",
          "Tu cuenta ha sido desactivada. Por favor contacta al administrador del sistema."
        );
      } else {
        showAlert(
          "Error",
          "Credenciales inválidas. Por favor verifica tus datos."
        );
      }
    } finally {
      setIsLoading(false);
      setPassword(""); // Limpiar la contraseña después de un intento fallido
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../../assets/images/logo.png")}
        style={[
          styles.logo,
          isLargeScreen && styles.logoLarge
        ]}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>¡Bienvenido a Aliados Express!</Text>
      <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isLargeScreen && styles.inputLarge]}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
          placeholderTextColor="#666"
        />

        <TextInput
          style={[styles.input, isLargeScreen && styles.inputLarge]}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!isLoading}
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={[
            styles.button,
            isLargeScreen && styles.buttonLarge
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 30,
  },
  logoLarge: {
    width: 300,
    height: 120,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    width: "100%",
    height: 55,
    borderWidth: 2,
    borderColor: "#FFD700", // Color amarillo
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    fontSize: 16,
    color: "#000",
  },
  inputLarge: {
    fontSize: 18,
    height: 60,
  },
  button: {
    width: "100%",
    height: 55,
    backgroundColor: "#2563EB", // Azul más llamativo
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonLarge: {
    height: 60,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
})
