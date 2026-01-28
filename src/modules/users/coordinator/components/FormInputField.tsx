import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";

interface FormInputFieldProps {
  label?: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  onChange: (text: string) => void;
  fieldKey: string;
  multiline?: boolean;
  rightNode?: React.ReactNode;
  // removed focusedField/onFocus/onBlur to avoid cross-input re-renders
}

export const FormInputField: React.FC<FormInputFieldProps> = ({
  label,
  iconName,
  value,
  placeholder,
  keyboardType,
  onChange,
  fieldKey,
  multiline = false,
  rightNode,
  // no focus props
}) => (
  <>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={styles.inputIcon}>
      <Ionicons name={iconName} size={18} color={Colors.menuText} />

      <TextInput
        style={styles.inputFlex}
        placeholder={placeholder}
        placeholderTextColor={Colors.menuText}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChange}
        // let native selection and focus behave normally
        multiline={multiline}
      />

      {rightNode}
    </View>
  </>
);

const styles = StyleSheet.create({
  label: {
    color: Colors.menuText,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 4,
    marginTop: 8,
  },

  inputIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.Border,
    gap: 8,
  },

  inputFlex: {
    flex: 1,
    color: Colors.normalText,
    outlineColor: "transparent",
    outlineWidth: 0,
  },

  inputIconFocused: {
    borderColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});
