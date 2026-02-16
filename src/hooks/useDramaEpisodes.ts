import { useCallback, useEffect, useState } from "react";
import { fetchDramaEpisodes } from "@/src/services/dramaApi";
import { DramaEpisode } from "@/src/types/drama";

type UseDramaEpisodesResult = {
  episodes: DramaEpisode[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type LoadOptions = {
  refreshing?: boolean;
  signal?: AbortSignal;
  forceRefresh?: boolean;
};

export const useDramaEpisodes = (bookId: string): UseDramaEpisodesResult => {
  const [episodes, setEpisodes] = useState<DramaEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async ({ refreshing = false, signal, forceRefresh = false }: LoadOptions = {}) => {
      if (!bookId) {
        setError("bookId tidak ditemukan.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await fetchDramaEpisodes(bookId, { signal, forceRefresh });
        setEpisodes(data);
        setError(null);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Terjadi kesalahan tidak dikenal.";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [bookId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(async () => {
    await load({ refreshing: true, forceRefresh: true });
  }, [load]);

  return { episodes, isLoading, isRefreshing, error, refresh };
};
