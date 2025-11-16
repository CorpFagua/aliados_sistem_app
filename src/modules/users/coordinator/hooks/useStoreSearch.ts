import { useState } from "react";
import { fetchStores } from "@/services/stores";

export interface UseStoreSearchReturn {
  storeQuery: string;
  selectedStore: { id: string; name: string } | null;
  storeResults: { id: string; name: string }[];
  loadingStores: boolean;
  handleSearchStores: (query: string) => Promise<void>;
  setSelectedStore: (store: { id: string; name: string } | null) => void;
  setStoreQuery: (query: string) => void;
  reset: () => void;
}

export const useStoreSearch = (accessToken: string): UseStoreSearchReturn => {
  const [storeQuery, setStoreQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [storeResults, setStoreResults] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const handleSearchStores = async (query: string) => {
    setStoreQuery(query);

    if (!query || query.length < 2) {
      setStoreResults([]);
      return;
    }

    try {
      setLoadingStores(true);
      const allStores = await fetchStores(accessToken);
      const filtered = allStores
        .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        .map((s) => ({ id: s.id, name: s.name }));

      setStoreResults(filtered);
    } catch (err) {
      console.error("Error buscando tiendas:", err);
      setStoreResults([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const reset = () => {
    setStoreQuery("");
    setSelectedStore(null);
    setStoreResults([]);
  };

  return {
    storeQuery,
    selectedStore,
    storeResults,
    loadingStores,
    handleSearchStores,
    setSelectedStore,
    setStoreQuery,
    reset,
  };
};
