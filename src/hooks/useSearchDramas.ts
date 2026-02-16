import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDramaSearch, fetchPopularSearches } from "@/src/services/dramaApi";
import { DramaItem, DramaSearchItem } from "@/src/types/drama";

const SEARCH_DEBOUNCE_MS = 350;

type UseSearchDramasResult = {
  popular: DramaItem[];
  results: DramaSearchItem[];
  isLoadingPopular: boolean;
  isSearching: boolean;
  popularError: string | null;
  searchError: string | null;
  refreshPopular: () => Promise<void>;
};

export const useSearchDramas = (query: string): UseSearchDramasResult => {
  const [popular, setPopular] = useState<DramaItem[]>([]);
  const [results, setResults] = useState<DramaSearchItem[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadPopular = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingPopular(true);

    try {
      const data = await fetchPopularSearches(signal);
      setPopular(data);
      setPopularError(null);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      const message =
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat popular searches.";
      setPopularError(message);
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadPopular(controller.signal);
    return () => controller.abort();
  }, [loadPopular]);

  useEffect(() => {
    const keyword = query.trim();
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    if (!keyword) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const data = await fetchDramaSearch(keyword, controller.signal);
          if (requestId !== requestIdRef.current) return;
          setResults(data);
          setSearchError(null);
        } catch (searchLoadError) {
          if (searchLoadError instanceof Error && searchLoadError.name === "AbortError") {
            return;
          }

          if (requestId !== requestIdRef.current) return;

          const message =
            searchLoadError instanceof Error
              ? searchLoadError.message
              : "Gagal mencari drama.";
          setSearchError(message);
        } finally {
          if (requestId === requestIdRef.current) {
            setIsSearching(false);
          }
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const refreshPopular = useCallback(async () => {
    await loadPopular();
  }, [loadPopular]);

  return {
    popular,
    results,
    isLoadingPopular,
    isSearching,
    popularError,
    searchError,
    refreshPopular,
  };
};
