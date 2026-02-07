// src/modules/users/coordinator/hooks/useAnalytics.ts
import { useState, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  AnalyticsResponse,
  AnalyticsQuery,
  fetchAnalytics,
} from "@/services/analytics";

interface UseAnalyticsReturn {
  data: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  fetchData: (query?: AnalyticsQuery) => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { session } = useAuth();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (query?: AnalyticsQuery) => {
      if (!session?.access_token) {
        setError("No token available");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchAnalytics(session.access_token, query);
        setData(result);
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token]
  );

  return { data, loading, error, fetchData };
}
