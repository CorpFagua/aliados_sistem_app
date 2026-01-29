import axios from "axios";
import { getApiUrl } from "@/config/environment";
import Toast from "react-native-toast-message";

const API_URL = getApiUrl();

// ⚡ Siempre que uses la API, parte de aquí
export const api = axios.create({
  baseURL: `${API_URL}/api`, // 👈 agregamos /api automáticamente
});

// Interceptor para manejar cuenta inactiva
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si es error 403 y el error es "inactive_account"
    if (error.response?.status === 403 && error.response?.data?.error === 'inactive_account') {
      console.log('🚫 [API] Cuenta inactiva detectada');
      
      // Mostrar toast
      Toast.show({
        type: 'error',
        text1: 'Cuenta desactivada',
        text2: error.response?.data?.message || 'Tu cuenta ha sido desactivada. Contacta al administrador.',
        position: 'top',
        visibilityTime: 5000,
      });

      // Importar dinámicamente para evitar dependencia circular
      const { signOut } = await import('@/services/auth');
      const { router } = await import('expo-router');
      
      // Cerrar sesión
      await signOut();
      router.replace('/(auth)/login');
    }
    
    return Promise.reject(error);
  }
);

// Log para debugging (solo en desarrollo)
if (__DEV__) {
  console.log('🌐 API Base URL:', API_URL);
}

// Helper para headers con token
export function authHeaders(token: string) {
  if (!token) {
    console.warn(`⚠️  [API] authHeaders: No hay token disponible`);
  }
  return { 
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}
