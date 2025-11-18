import { useState } from "react";
import { fetchStoreProfiles } from "@/services/stores";

export interface UseProfileStoreSearchReturn {
  profileQuery: string;
  selectedProfileStore: { id: string; name: string; store_id: string } | null;
  profileResults: { id: string; name: string; store_id: string }[];
  loadingProfiles: boolean;
  handleSearchProfileStores: (query: string) => Promise<void>;
  setSelectedProfileStore: (
    profile: { id: string; name: string; store_id: string } | null
  ) => void;
  setProfileQuery: (query: string) => void;
  reset: () => void;
}

export const useProfileStoreSearch = (
  accessToken: string
): UseProfileStoreSearchReturn => {
  const [profileQuery, setProfileQuery] = useState("");
  const [selectedProfileStore, setSelectedProfileStore] = useState<{
    id: string;
    name: string;
    store_id: string;
  } | null>(null);
  const [profileResults, setProfileResults] = useState<
    { id: string; name: string; store_id: string }[]
  >([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const handleSearchProfileStores = async (query: string) => {
    setProfileQuery(query);

    if (!query || query.length < 2) {
      setProfileResults([]);
      return;
    }

    try {
      setLoadingProfiles(true);
      const allProfiles = await fetchStoreProfiles(accessToken);
      const filtered = allProfiles
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .map((p) => ({ id: p.id, name: p.name, store_id: p.store_id }));

      setProfileResults(filtered);
    } catch (err) {
      console.error("Error buscando perfiles de tienda:", err);
      setProfileResults([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const reset = () => {
    setProfileQuery("");
    setSelectedProfileStore(null);
    setProfileResults([]);
  };

  return {
    profileQuery,
    selectedProfileStore,
    profileResults,
    loadingProfiles,
    handleSearchProfileStores,
    setSelectedProfileStore,
    setProfileQuery,
    reset,
  };
};
