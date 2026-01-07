import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Colors } from "@/constans/colors";

export type TabType = "domicilios" | "aliados" | "coordinadora";

interface TabsNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: Array<{ key: TabType; label: string }> = [
  { key: "domicilios", label: "Domicilios" },
  { key: "aliados", label: "Paquetería Aliados" },
  { key: "coordinadora", label: "Paquetería Coordinadora" },
];

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  onTabChange,
}) => (
  <View style={styles.tabsContainer}>
    {TABS.map((tab) => (
      <TouchableOpacity
        key={tab.key}
        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
        onPress={() => onTabChange(tab.key)}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === tab.key && styles.tabTextActive,
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#111",
    padding: 4,
    borderRadius: 10,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: Colors.normalText,
  },

  tabText: { color: Colors.menuText, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#000", fontWeight: "700" },
});
