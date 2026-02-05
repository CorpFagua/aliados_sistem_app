// src/modules/users/coordinator/components/AnalyticsDateRangeSelector.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import { Colors } from "@/constans/colors";

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
}

export default function AnalyticsDateRangeSelector({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const handleToday = () => {
    const today = new Date().toISOString().split("T")[0];
    onDateRangeChange(today, today);
    setShowModal(false);
  };

  const handleLast7Days = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    onDateRangeChange(
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0]
    );
    setShowModal(false);
  };

  const handleLast30Days = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    onDateRangeChange(
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0]
    );
    setShowModal(false);
  };

  const handleCustom = () => {
    onDateRangeChange(tempStart, tempEnd);
    setShowModal(false);
  };

  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.buttonText}>
          📅 {formatDate(startDate)} a {formatDate(endDate)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Rango de Fechas</Text>

            {/* Quick Buttons */}
            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={handleToday}
              >
                <Text style={styles.quickBtnText}>Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={handleLast7Days}
              >
                <Text style={styles.quickBtnText}>Últimos 7 días</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={handleLast30Days}
              >
                <Text style={styles.quickBtnText}>Últimos 30 días</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Date Inputs */}
            <View style={styles.customSection}>
              <Text style={styles.customLabel}>Fecha Inicio</Text>
              <TextInput
                style={styles.dateInput}
                value={tempStart}
                onChangeText={setTempStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.menuText}
              />

              <Text style={[styles.customLabel, { marginTop: 16 }]}>
                Fecha Fin
              </Text>
              <TextInput
                style={styles.dateInput}
                value={tempEnd}
                onChangeText={setTempEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.menuText}
              />

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => {
                    setTempStart(startDate);
                    setTempEnd(endDate);
                    setShowModal(false);
                  }}
                >
                  <Text style={styles.modalBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.applyBtn]}
                  onPress={handleCustom}
                >
                  <Text style={[styles.modalBtnText, { color: Colors.Background }]}>
                    Aplicar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: Colors.activeMenuText,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.Background,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  modalTitle: {
    color: Colors.normalText,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  quickButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "rgba(244, 197, 66, 0.1)",
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.activeMenuText,
  },
  quickBtnText: {
    color: Colors.activeMenuText,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  customSection: {
    marginBottom: 20,
  },
  customLabel: {
    color: Colors.menuText,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  dateInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: Colors.normalText,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: Colors.Border,
  },
  applyBtn: {
    backgroundColor: Colors.activeMenuText,
    borderColor: Colors.activeMenuText,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.menuText,
  },
});
