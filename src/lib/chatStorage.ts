// src/lib/chatStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatMessage } from "@/models/chat";

export async function saveChatMessages(serviceId: string, messages: ChatMessage[]) {
  try {
    await AsyncStorage.setItem(`chat_${serviceId}`, JSON.stringify(messages));
  } catch (error) {
    console.error("Error guardando mensajes locales:", error);
  }
}

export async function loadChatMessages(serviceId: string): Promise<ChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(`chat_${serviceId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error cargando mensajes locales:", error);
    return [];
  }
}

export async function clearChatMessages(serviceId: string) {
  try {
    await AsyncStorage.removeItem(`chat_${serviceId}`);
  } catch (error) {
    console.error("Error eliminando mensajes locales:", error);
  }
}

/**
 * 🧹 Limpia TODO el almacenamiento local (chats, tokens, etc.)
 * Compatible con Web y Móvil
 */
export async function clearAllLocalData() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      // 🔍 Borra solo las claves que empiecen con "chat_"
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("chat_")) {
          localStorage.removeItem(key);
        }
      }
      console.log("🧹 Datos de chat eliminados (web)");
    } else {
      // 🔍 En móvil, buscamos claves con "chat_"
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter((key) => key.startsWith("chat_"));
      await AsyncStorage.multiRemove(chatKeys);
      console.log("🧹 Datos de chat eliminados (móvil)");
    }
  } catch (error) {
    console.error("Error limpiando datos locales del chat:", error);
  }
}

