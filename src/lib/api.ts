import axios from "axios";
import { getApiUrl } from "@/config/environment";

const API_URL = getApiUrl();

// ⚡ Siempre que uses la API, parte de aquí
export const api = axios.create({
  baseURL: `${API_URL}/api`, // 👈 agregamos /api automáticamente
});

// Bandera para prevenir múltiples ejecuciones del logout
let isLoggingOut = false;

// Interceptor para detectar cuenta inactiva
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Solo ejecutar una vez
    if (error.response?.status === 403 && 
        error.response?.data?.error === 'inactive_account' && 
        !isLoggingOut) {
      
      isLoggingOut = true;
      console.log('🚫 [API] Cuenta inactiva detectada - Cerrando sesión...');
      
      // Ejecutar en el siguiente tick para evitar bucles de render
      setTimeout(async () => {
        try {
          // Importar dinámicamente para evitar dependencias circulares
          const Toast = (await import('react-native-toast-message')).default;
          const { router } = await import('expo-router');
          const { signOut } = await import('@/services/auth');
          
          // Mostrar toast
          Toast.show({
            type: 'error',
            text1: 'Cuenta desactivada',
            text2: error.response?.data?.message || 'Tu cuenta ha sido desactivada. Contacta al administrador.',
            position: 'top',
            visibilityTime: 4000,
          });
          
          // Cerrar sesión
          await signOut();
          
          // Redirigir a login
          router.replace('/(auth)/login');
          
          // Reset bandera después de un tiempo
          setTimeout(() => {
            isLoggingOut = false;
          }, 2000);
          
        } catch (logoutError) {
          console.error('❌ Error en logout automático:', logoutError);
          isLoggingOut = false;
        }
      }, 100);
    }
    
    return Promise.reject(error);
  }
);

// Función para resetear la bandera (útil para testing)
export function resetLogoutFlag() {
  isLoggingOut = false;
}

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
