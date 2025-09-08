import React, { useState, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import CardProfile from "./CardProfile";

type HeaderProps = {
  profileRoute?: string;
  onNotificationsPress?: () => void;
  notificationsCount?: number;
};

export default function Header({
  profileRoute,
  onNotificationsPress,
  notificationsCount = 0,
}: HeaderProps) {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
 const isProfile = pathname?.includes("/profile");

  const [isCardVisible, setCardVisible] = useState(false);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  const profileButtonRef = useRef<HTMLDivElement | null>(null); // Para web usamos HTMLDivElement

const handleProfilePress = () => {
  if (isLargeScreen && profileButtonRef.current) {
    const rect = profileButtonRef.current.getBoundingClientRect();
    const cardWidth = 250; // ancho de la card
    const screenWidth = window.innerWidth; // ancho de pantalla en web
    let left = rect.left;

    // Ajuste si se sale del borde derecho
    if (rect.left + cardWidth > screenWidth - 8) { // 8px margen
      left = screenWidth - cardWidth - 8;
    }

    setCardPosition({ top: rect.bottom + 8, left });
    setCardVisible(true);
  } else {
    router.push(profileRoute || "/shared/profile");
  }
};


  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {isProfile ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.title}>Mi Perfil</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Image
              source={require("../../assets/images/LOGO.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.rightButtons}>
              <TouchableOpacity onPress={onNotificationsPress} style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {notificationsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationsCount > 99 ? "99+" : notificationsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                ref={profileButtonRef as any} // ref compatible con web y mobile
                onPress={handleProfilePress}
                style={styles.profileButtonWrapper}
              >
                <LinearGradient
                  colors={["#00FF75", "#2563EB"]}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.gradientBorder}
                >
                  <View style={styles.profileImageContainer}>
                    <Image
                      source={{
                        uri:
                          session?.user?.user_metadata?.avatar_url ||
                          "https://via.placeholder.com/150",
                      }}
                      style={styles.profileImage}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Modal Card */}
      {isLargeScreen && isCardVisible && (
        <Modal transparent animationType="fade" onRequestClose={() => setCardVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setCardVisible(false)}
          >
            <View
              style={[
                styles.cardWrapper,
                { top: cardPosition.top, left: cardPosition.left, position: "absolute" },
              ]}
            >
              <CardProfile onClose={() => setCardVisible(false)} />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#111" },
  container: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  logo: { width: 150, height: 50, tintColor: "#fff" },
  backButton: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "600", marginLeft: 8, color: "#fff" },
  rightButtons: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { padding: 6, position: "relative" },
  profileButtonWrapper: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
  gradientBorder: { flex: 1, borderRadius: 22, padding: 2 },
  profileImageContainer: { flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#111" },
  profileImage: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  cardWrapper: {}, // la posición se setea dinámicamente
});
