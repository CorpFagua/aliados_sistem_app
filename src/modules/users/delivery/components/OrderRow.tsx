// src/modules/users/delivery/components/OrderRow.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"; // recomendado por docs
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from "@/constans/colors";
import { Service } from "@/models/service";

/**
 * Calcula el estado (ok|alerta|critico) y la etiqueta (label) para mostrar en la tarjeta.
 * - Si existe pedido.prepTime usamos ese valor para calcular minutos restantes.
 * - Si no existe, usamos createdAt y el status para fallback.
 */
function calcularEstadoTiempo(pedido: Service) {
  const now = new Date();
  const creado = new Date(pedido.createdAt);
  const minutosTranscurridos = Math.floor(
    (now.getTime() - creado.getTime()) / 60000
  );

  let estado: "ok" | "alerta" | "critico" = "ok";
  let label = "";

  if (pedido.prepTime != null) {
    const minutosRestantes = pedido.prepTime - minutosTranscurridos;

    if (minutosRestantes <= 0) {
      estado = "critico";
      label = `Listo (+${Math.abs(minutosRestantes)} min)`;
    } else if (minutosRestantes <= 5) {
      estado = "alerta";
      label = `Faltan ${minutosRestantes} min`;
    } else {
      estado = "ok";
      label = `Faltan ${minutosRestantes} min`;
    }
  } else {
    // fallback si no hay prepTime
    if (pedido.status === "disponible") {
      if (minutosTranscurridos <= 5) estado = "ok";
      else if (minutosTranscurridos <= 10) estado = "alerta";
      else estado = "critico";
      label = `Esperando · ${minutosTranscurridos} min`;
    } else if (pedido.status === "en_ruta") {
      if (minutosTranscurridos <= 20) estado = "ok";
      else if (minutosTranscurridos <= 30) estado = "alerta";
      else estado = "critico";
      label = `En trayecto · ${minutosTranscurridos} min`;
    } else {
      label = `Hace ${minutosTranscurridos} min`;
    }
  }

  return { estado, label };
}

// ================= Props del componente =================
interface Props {
  pedido: Service;
  onPress?: () => void;

  // LEFT action (deslizar a la derecha muestra la acción izquierda)
  leftEnabled?: boolean; // si false => no se muestra acción
  leftLabel?: string;
  leftColor?: string;
  onLeftAction?: (pedido: Service) => void | Promise<void | boolean>; // si retorna false puedes decidir no cerrar (opcional)

  // RIGHT action (deslizar a la izquierda muestra la acción derecha)
  rightEnabled?: boolean;
  rightLabel?: string;
  rightColor?: string;
  onRightAction?: (pedido: Service) => void | Promise<void | boolean>;

  // comportamiento
  closeOnAction?: boolean; // por defecto true: cierra swipe después de ejecutar la acción
  onActionComplete?: (pedido: Service, direction: "left" | "right") => void; // callback para que el padre refresque UI
}

export default function OrderRow({
  pedido,
  onPress,

  leftEnabled = false,
  leftLabel = "Asignar",
  leftColor = Colors.activeTabText,
  onLeftAction,

  rightEnabled = false,
  rightLabel = "Cancelar",
  rightColor = "#FF3B30",
  onRightAction,

  closeOnAction = true,
  onActionComplete,
}: Props) {
  // estado tiempo / semáforo
  const [tiempo, setTiempo] = useState(() => calcularEstadoTiempo(pedido));
  const { estado, label } = tiempo;
  const tiempoColors = { ok: "#00FF75", alerta: "#FFD60A", critico: "#FF3B30" };

  // ref al swipeable (lo dejamos any para evitar fricciones de tipos con ReanimatedSwipeable)
  const swipeableRef = useRef<any>(null);

  // flag para evitar ejecuciones dobles
  const processingRef = useRef(false);
  const [processing, setProcessing] = useState(false);

  // recalcula cada minuto
  useEffect(() => {
    setTiempo(calcularEstadoTiempo(pedido));
    const interval = setInterval(() => {
      setTiempo(calcularEstadoTiempo(pedido));
    }, 60_000);
    return () => clearInterval(interval);
  }, [pedido]);

  // helper para ejecutar acciones (acepta sync/async)
  async function runAction(
    direction: "left" | "right",
    swipeMethods?: { close?: () => void }
  ) {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    try {
      let result: void | boolean | undefined;
      if (direction === "left" && onLeftAction) {
        result = await onLeftAction(pedido);
      } else if (direction === "right" && onRightAction) {
        result = await onRightAction(pedido);
      }

      // Si closeOnAction es true y la acción no devolvió explícitamente false, cerramos
      if (closeOnAction && result !== false) {
        if (swipeMethods?.close) swipeMethods.close();
        else swipeableRef.current?.close?.();
      }

      // notificar al padre para que refresque la UI si desea
      onActionComplete?.(pedido, direction);
    } catch (err) {
      console.error("OrderRow action error:", err);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }

  // Render para acción izquierda (se pasa a ReanimatedSwipeable)
  const RenderLeftAction = (progress: any, drag: any, swipeMethods?: any) => {
    const animatedStyle = useAnimatedStyle(() => {
      // drag es un SharedValue: usamos drag.value
      const scale = interpolate(drag?.value ?? 0, [0, 80], [0.6, 1], "clamp");
      return { transform: [{ scale }] };
    });

    // Si está deshabilitado, retornamos null (el componente no lo mostrará)
    if (!leftEnabled) return null;

    return (
      <Animated.View
        style={[
          styles.actionContainer,
          { backgroundColor: leftColor },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => runAction("left", swipeMethods)}
          disabled={processing}
          style={styles.actionTouchable}
        >
          <Ionicons name="checkmark-circle-outline" size={26} color="#fff" />
          <Text style={styles.actionText}>{leftLabel}</Text>
          {processing && (
            <ActivityIndicator color="#fff" style={{ marginTop: 6 }} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render para acción derecha
  const RenderRightAction = (progress: any, drag: any, swipeMethods?: any) => {
    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        -(drag?.value ?? 0),
        [0, 80],
        [0.6, 1],
        "clamp"
      );
      return { transform: [{ scale }] };
    });

    if (!rightEnabled) return null;

    return (
      <Animated.View
        style={[
          styles.actionContainer,
          { backgroundColor: rightColor },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => runAction("right", swipeMethods)}
          disabled={processing}
          style={styles.actionTouchable}
        >
          <Ionicons name="close-circle-outline" size={26} color="#fff" />
          <Text style={styles.actionText}>{rightLabel}</Text>
          {processing && (
            <ActivityIndicator color="#fff" style={{ marginTop: 6 }} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    // Si en la app ya envuelves todo con GestureHandlerRootView, puedes quitarlo aquí.
    <GestureHandlerRootView>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        overshootFriction={6}
        // API: renderLeftActions(progress, translation, swipeableMethods)
        renderLeftActions={leftEnabled ? RenderLeftAction : undefined}
        renderRightActions={rightEnabled ? RenderRightAction : undefined}
        leftThreshold={60}
        rightThreshold={60}
        onSwipeableOpen={(direction: string) => {
          // ⚡️ direction = "left" -> expone acciones de la derecha
          // ⚡️ direction = "right" -> expone acciones de la izquierda
          if (direction === "right" && leftEnabled && onLeftAction) {
            runAction("left");
          } else if (direction === "left" && rightEnabled && onRightAction) {
            runAction("right");
          }
        }}
      >
        <TouchableOpacity
          style={styles.row}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <View style={styles.left}>
            {pedido.storeName && (
              <Text style={styles.store}>{pedido.storeName}</Text>
            )}

            <Text style={styles.destination}>
              <Ionicons
                name="location-outline"
                size={14}
                color={Colors.menuText}
              />{" "}
              {pedido.destination}
            </Text>

            <View style={styles.detailLine}>
              <Text style={styles.zone}>
                <Ionicons
                  name="map-outline"
                  size={14}
                  color={Colors.menuText}
                />{" "}
                {pedido.zoneId || "Sin zona"}
              </Text>

              <View style={styles.timeBox}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={tiempoColors[estado]}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.timeText, { color: tiempoColors[estado] }]}
                >
                  {label}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: tiempoColors[estado] + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: tiempoColors[estado] }]}>
              {pedido.prepTime != null
                ? `${pedido.prepTime} min`
                : pedido.status}
            </Text>
          </View>
        </TouchableOpacity>
      </ReanimatedSwipeable>
    </GestureHandlerRootView>
  );
}

// ================= Styles =================
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    backgroundColor: Colors.activeMenuBackground,
  },
  left: { flex: 1, marginRight: 8 },
  store: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 2,
  },
  destination: { fontSize: 14, color: Colors.normalText, marginBottom: 4 },
  detailLine: { flexDirection: "row", alignItems: "center", gap: 12 },
  zone: { fontSize: 13, color: Colors.menuText },
  timeBox: { flexDirection: "row", alignItems: "center" },
  timeText: { fontSize: 13, fontWeight: "500" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: "600" },

  // acciones swipe
  actionContainer: {
    width: 110,
    justifyContent: "center",
    alignItems: "center",
    // height debe coincidir con la row para apariencia consistente
    alignSelf: "stretch",
  },
  actionTouchable: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
});
