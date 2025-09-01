import React from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Header() {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isProfile = pathname === "/shared/profile";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {isProfile ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#000" />
            <Text style={styles.title}>Mi Perfil</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Image
              source={require("../../assets/images/LOGO-BLACK.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => router.push("/shared/profile")}
              style={styles.profileButton}
            >
              <Image
                source={{
                  uri:
                    session?.user?.user_metadata?.avatar_url ||
                    "https://via.placeholder.com/150", // 🔧 usa placeholder visible
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFF",
  },
  container: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  logo: {
    width: 120,
    height: 35,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    color: "#000",
  },
});
