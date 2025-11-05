import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import Animated, { FadeInRight, FadeInLeft } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { fetchMessages, sendMessage, subscribeToChat } from "@/services/chat";
import { loadChatMessages, saveChatMessages } from "@/lib/chatStorage";

const screenHeight = Dimensions.get("window").height;

export default function ChatModal({
  visible,
  onClose,
  serviceId,
  token,
  userId, // 👈 ahora pasas el id del usuario autenticado
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!visible || !serviceId) return;
    let unsubscribe = null;

    (async () => {
      // 1️⃣ Cargar mensajes locales
      const localMsgs = await loadChatMessages(serviceId);
      setMessages(localMsgs);

      // 2️⃣ Cargar mensajes remotos
      try {
        const remoteMsgs = await fetchMessages(serviceId, token);
        setMessages(remoteMsgs);
        await saveChatMessages(serviceId, remoteMsgs);
      } catch (err) {
        console.error("Error cargando chat:", err);
      }

      // 3️⃣ Suscripción en tiempo real
      unsubscribe = subscribeToChat(serviceId, async (newMsg) => {
        console.log("💬 Nuevo mensaje:", newMsg);
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMsg.id);
          if (exists) return prev;
          const updated = [...prev, newMsg];
          saveChatMessages(serviceId, updated);
          return updated;
        });
      });
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [visible, serviceId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const newMsg = await sendMessage(serviceId, text, token);
      const updated = [...messages, newMsg];
      setMessages(updated);
      await saveChatMessages(serviceId, updated);
      setText("");
      listRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    console.log("Renderizando mensaje:", item);
    const isMine = item.sender_id === userId;

    // Colores personalizados para roles
    const roleColors = {
      store: "#007AFF", // Azul para tienda
      delivery: "#00C851", // Verde para domiciliario
      coordinator: "#FFBB33", // Amarillo para coordinador
      super_admin: "#9C27B0", // Morado para admin
    };

    const borderColor = isMine ? "#00FF7580" : roleColors[item.sender_role] || "#3A3A3C";

    return (
      <Animated.View
        entering={isMine ? FadeInRight.springify() : FadeInLeft.springify()}
        style={[styles.messageRow, isMine ? styles.myRow : styles.otherRow]}
      >
        {/* Avatar solo para el otro usuario */}
        {!isMine && (
          <Image source={require("../../assets/images/SUBMARK.png")} style={styles.avatar} />
        )}

        <View
          style={[
            styles.bubble,
            isMine
              ? [styles.myBubble, { borderColor }]
              : [styles.otherBubble, { borderColor }],
          ]}
        >
          <Text
            style={[
              styles.msgText,
              isMine ? styles.myMsgText : styles.otherMsgText,
            ]}
          >
            {item.message}
          </Text>

          <View style={styles.metaRow}>
            {/* 🟡 Solo mostrar el rol si no es mío */}
            {!isMine && (
              <Text
                style={[
                  styles.roleText,
                  { color: roleColors[item.sender_role] || "#aaa" },
                ]}
              >
                {item.sender_role?.toUpperCase()}
              </Text>
            )}
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            Platform.OS === "web" ? styles.modalWeb : styles.modalMobile,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chat del pedido</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* Lista de mensajes */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#aaa"
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSend}
              disabled={loading}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.Border,
    overflow: "hidden",
  },
  modalWeb: {
    width: 450,
    height: 580,
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 16,
  },
  modalMobile: {
    height: screenHeight * 0.9,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: Colors.Border,
  },
  title: {
    color: Colors.normalText,
    fontWeight: "700",
    fontSize: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 6,
    marginHorizontal: 10,
  },
  myRow: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  otherRow: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  bubble: {
    maxWidth: Platform.OS === "web" ? 500 : "75%",
    width: "auto",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: "#1F2937",
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: "#00FF7580",
    marginLeft: 40,
  },
  otherBubble: {
    backgroundColor: "#2C2C2E",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#3A3A3C",
    marginRight: 40,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    flexWrap: "wrap",
    ...(Platform.OS === "web"
      ? {
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
        }
      : {}),
  },
  myMsgText: {
    color: Colors.normalText,
  },
  otherMsgText: {
    color: "#E5E5E7",
  },
  timeText: {
    fontSize: 11,
    color: "#8E8E93",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: Colors.Border,
    padding: 10,
    backgroundColor: "rgba(42,42,42,0.9)",
  },
  input: {
    flex: 1,
    color: Colors.normalText,
    padding: 10,
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
  },
  sendBtn: {
    backgroundColor: "#00FF7580",
    padding: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
