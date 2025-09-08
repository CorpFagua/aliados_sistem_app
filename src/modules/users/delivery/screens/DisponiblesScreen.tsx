import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const TABS = ["Disponibles", "Tomados", "Por recoger"];
const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

export default function DisponiblesScreen() {
  return(
    <View><Text style={styles.Text}>Disponibles Screen</Text></View>
  )
}

//styles
const styles = StyleSheet.create({
  Text: {
    color: Colors.menuText,
  },
});
