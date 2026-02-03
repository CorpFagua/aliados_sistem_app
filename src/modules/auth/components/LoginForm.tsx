import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/providers/AuthProvider"
import Toast from 'react-native-toast-message'; // 👈 Importar Toast

export default function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    // 1. Manejo de campos vacíos
    if (!email || !password) {
        Toast.show({
            type: 'error',
            text1: 'Campos requeridos',
            text2: 'Por favor, introduce tu correo y contraseña.',
            position: 'top',
        });
        return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Opcional: Mostrar un Toast de éxito (aunque la redirección es suficiente)
      // Toast.show({
      //    type: 'success',
      //    text1: '¡Bienvenido!',
      //    text2: 'Has iniciado sesión correctamente.',
      // });
    } catch (error: any) {
      // 2. Mostrar Toast en caso de error
      let errorMessage = 'Error de inicio de sesión. Inténtalo de nuevo.';
      
      // Intentar obtener un mensaje de error más específico
      if (error.message) {
        // En tu AuthProvider estás propagando el error con .message
        // por ejemplo: "Invalid login credentials", "Usuario inactivo"
        errorMessage = error.message; 
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error al Ingresar',
        text2: errorMessage,
        position: 'top',
      });

    } finally {
      setIsLoading(false);
      setPassword(""); // Limpiar la contraseña en ambos casos (éxito o error)
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
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>
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

// ... (El resto de tus estilos StyleSheet.create se mantiene igual)
const styles = StyleSheet.create({
  // ... (tus estilos existentes)
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingRight: 48,
    backgroundColor: "#222",
    fontSize: 16,
    color: "#fff",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: 48,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
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