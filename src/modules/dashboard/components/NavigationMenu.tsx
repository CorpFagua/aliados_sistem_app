import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type NavigationMenuProps = {
  active: string;
  onSelect: (id: string) => void;
  mobileItems?: MenuItem[];  // 👈 opcionales
  desktopItems?: MenuItem[]; // 👈 opcionales
};

export default function NavigationMenu({
  active,
  onSelect,
  mobileItems = [],
  desktopItems = [],
}: NavigationMenuProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const items = isLargeScreen ? desktopItems : mobileItems;

  // ✅ Si no hay items, no renderiza nada
  if (!items || items.length === 0) return null;

  if (isLargeScreen) {
    // 📌 Sidebar (desktop / tablet)
    return (
      <View style={styles.sidebar}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              active === item.id && styles.activeMenuItem,
            ]}
            onPress={() => onSelect(item.id)}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={active === item.id ? Colors.iconActive : Colors.iconDefault}
            />
            <Text
              style={[
                styles.menuText,
                active === item.id && styles.activeMenuText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // 📌 Tab bar (móvil)
  return (
    <View style={styles.tabBar}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.tabItem}
          onPress={() => onSelect(item.id)}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={active === item.id ? Colors.iconActive : Colors.iconDefault}
          />
          <Text
            style={[
              styles.tabText,
              active === item.id && styles.activeTabText,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sidebar
  sidebar: {
    width: 200,
    backgroundColor: Colors.Background,
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: Colors.Border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 10,
  },
  menuText: {
    color: Colors.menuText,
    fontSize: 14,
  },
  activeMenuItem: {
    backgroundColor: Colors.activeMenuBackground,
  },
  activeMenuText: {
    color: Colors.activeMenuText,
    fontWeight: "600",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBarBorder,
    paddingVertical: 10,
  },
  tabItem: {
    alignItems: "center",
  },
  tabText: {
    color: Colors.tabText,
    fontSize: 12,
    marginTop: 2,
  },
  activeTabText: {
    color: Colors.activeMenuText,
    fontWeight: "600",
  },
});
