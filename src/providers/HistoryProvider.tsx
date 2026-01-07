/**
 * Proveedor para persistencia de estado entre navegaciones
 * Mantiene el estado del historial cuando cambias de pestaña
 */

import React, { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useServiceHistoryOptimized } from "../hooks/useServiceHistoryOptimized";

interface HistoryContextType {
  // State
  services: any[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedService: any;
  serviceLoading: boolean;

  // Methods
  getServiceHistory: (filters: any, append?: boolean) => Promise<void>;
  getServiceDetail: (serviceId: string) => Promise<void>;
  search: (searchTerm: string, newFilters?: any) => void;
  applyFilters: (newFilters: any) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;

  // Scroll persistence
  saveScrollPosition: (offset: number, index: number) => void;
  getScrollPosition: () => { offset: number; index: number };

  // Utils
  setSelectedService: (service: any) => void;
  setError: (error: string | null) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children, token }: { children: ReactNode; token: string | null }) {
  const hook = useServiceHistoryOptimized(token);

  return <HistoryContext.Provider value={hook as any}>{children}</HistoryContext.Provider>;
}

export function useHistoryContext() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistoryContext debe ser usado dentro de HistoryProvider");
  }
  return context;
}
