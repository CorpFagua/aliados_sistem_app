import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { FormInputField } from "./FormInputField";

interface StoreSelectorProps {
  storeQuery: string;
  selectedStore: { id: string; name: string } | null;
  storeResults: { id: string; name: string }[];
  loadingStores: boolean;
  onSearch: (query: string) => void;
  onSelectStore: (store: { id: string; name: string }) => void;
  onClearStore: () => void;
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  storeQuery,
  selectedStore,
  storeResults,
  loadingStores,
  onSearch,
  onSelectStore,
  onClearStore,
}) => {
  return (
    <>
      <FormInputField
        label="Seleccionar tienda"
        iconName="storefront-outline"
        placeholder="Buscar tienda por nombre"
        value={selectedStore ? selectedStore.name : storeQuery}
        onChange={(t) => {
          onClearStore();
          onSearch(t);
        }}
        fieldKey="store"
        rightNode={
          selectedStore ? (
            <TouchableOpacity onPress={onClearStore}>
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.menuText}
              />
            </TouchableOpacity>
          ) : null
        }
        // focus handled locally by TextInput
      />

      {/* LISTA DE RESULTADOS */}
      {storeResults.length > 0 && !selectedStore && (
        <View style={styles.dropdown}>
          {storeResults.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.dropdownItem}
              onPress={() => {
                onSelectStore(item);
              }}
            >
              <Text style={styles.dropdownText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loadingStores && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.normalText} />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dropdownText: {
    color: Colors.normalText,
  },
  loaderContainer: {
    marginTop: 8,
    alignItems: "center",
  },
});
