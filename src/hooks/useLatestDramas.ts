import { useCallback, useEffect, useState } from "react";
import { DramaFeedCategory, fetchDramaFeed } from "@/src/services/dramaApi";
import { DramaItem } from "@/src/types/drama";

type UseLatestDramasResult = {
  dramas: DramaItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
};

type LoadOptions = {
  refreshing?: boolean;
  signal?: AbortSignal;
};

export const useDramaFeed = (category: DramaFeedCategory): UseLatestDramasResult => {
  const [dramas, setDramas] = useState<DramaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async ({ refreshing = false, signal }: LoadOptions = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchDramaFeed(category, signal);
      setDramas(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : "Terjadi kesalahan tidak dikenal.";

      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [category]);

  useEffect(() => {
    const controller = new AbortController();
    void load({ signal: controller.signal });

    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(async () => {
    await load({ refreshing: true });
  }, [load]);

  return { dramas, isLoading, isRefreshing, error, lastUpdated, refresh };
};

export const useLatestDramas = (): UseLatestDramasResult => {
  return useDramaFeed("latest");
};
