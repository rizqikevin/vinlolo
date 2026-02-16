import { useCallback, useEffect, useRef, useState } from "react";
import { AsyncStorage } from "@/src/services/asyncStorage";
import { DramaFeedCategory, fetchDramaEpisodes } from "@/src/services/dramaApi";
import { DramaEpisode, DramaItem } from "@/src/types/drama";
import { getPreferredStreamUrl } from "@/src/utils/episodes";

const MAX_DRAMAS_IN_HOME_SHORTS = 18;
const SHORTS_CACHE_KEY_PREFIX = "home_shorts_cache_v1";
const WATCHED_SHORTS_IDS_KEY = "home_shorts_watched_ids_v1";
const WATCHED_IDS_MAX = 500;

export type HomeShortFeedItem = {
  id: string;
  bookId: string;
  dramaTitle: string;
  drama: DramaItem;
  episode: DramaEpisode;
  streamUrl: string;
};

type UseHomeShortFeedResult = {
  items: HomeShortFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isUsingOfflineCache: boolean;
  error: string | null;
  markAsWatched: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

type BuildOptions = {
  refreshing?: boolean;
  forceRefresh?: boolean;
};

type UseHomeShortFeedOptions = {
  category: DramaFeedCategory;
  isOnline: boolean;
};

type HomeShortFeedCachePayload = {
  savedAt: number;
  items: HomeShortFeedItem[];
};

const getShortsCacheKey = (category: DramaFeedCategory) =>
  `${SHORTS_CACHE_KEY_PREFIX}:${category}`;

const normalizeCachedShortItems = (value: unknown): HomeShortFeedItem[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is HomeShortFeedItem => {
    if (!item || typeof item !== "object") return false;
    const raw = item as Record<string, unknown>;
    return (
      typeof raw.id === "string" &&
      typeof raw.bookId === "string" &&
      typeof raw.dramaTitle === "string" &&
      typeof raw.streamUrl === "string" &&
      Boolean(raw.drama) &&
      Boolean(raw.episode)
    );
  });
};

const getOfflineItemsFromCache = (
  cachedItems: HomeShortFeedItem[],
  watchedIds: Set<string>
): HomeShortFeedItem[] => {
  if (cachedItems.length === 0) return [];
  if (watchedIds.size === 0) return cachedItems;

  const watchedOnly = cachedItems.filter((item) => watchedIds.has(item.id));
  return watchedOnly.length > 0 ? watchedOnly : cachedItems;
};

export const useHomeShortFeed = (
  dramas: DramaItem[],
  { category, isOnline }: UseHomeShortFeedOptions
): UseHomeShortFeedResult => {
  const [items, setItems] = useState<HomeShortFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUsingOfflineCache, setIsUsingOfflineCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const requestIdRef = useRef(0);
  const itemsRef = useRef<HomeShortFeedItem[]>([]);
  const cachedItemsRef = useRef<HomeShortFeedItem[]>([]);
  const watchedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let mounted = true;

    const hydrateCache = async () => {
      setIsHydrated(false);

      const [watchedIdsRaw, cachePayload] = await Promise.all([
        AsyncStorage.getJson<string[]>(WATCHED_SHORTS_IDS_KEY),
        AsyncStorage.getJson<HomeShortFeedCachePayload>(getShortsCacheKey(category)),
      ]);

      if (!mounted) return;

      watchedIdsRef.current = new Set(
        Array.isArray(watchedIdsRaw)
          ? watchedIdsRaw.filter((id): id is string => typeof id === "string")
          : []
      );

      const cachedItems = normalizeCachedShortItems(cachePayload?.items);
      cachedItemsRef.current = cachedItems;

      if (cachedItems.length > 0) {
        setItems(cachedItems);
        itemsRef.current = cachedItems;
        setError(null);
        setIsUsingOfflineCache(false);
        setIsLoading(false);
      }

      setIsHydrated(true);
    };

    void hydrateCache();

    return () => {
      mounted = false;
    };
  }, [category]);

  const buildFeed = useCallback(
    async ({ refreshing = false, forceRefresh = false }: BuildOptions = {}) => {
      if (!isHydrated) return;
      const requestId = ++requestIdRef.current;

      if (refreshing) {
        setIsRefreshing(true);
      } else if (itemsRef.current.length === 0) {
        setIsLoading(true);
      }

      try {
        if (!isOnline) {
          if (requestId !== requestIdRef.current) return;

          const fallbackItems = getOfflineItemsFromCache(
            cachedItemsRef.current,
            watchedIdsRef.current
          );
          if (fallbackItems.length > 0) {
            setItems(fallbackItems);
            setIsUsingOfflineCache(true);
            setError(null);
          } else {
            setError("Mode offline: shorts belum tersedia di cache.");
          }
          return;
        }

        const candidates = dramas.slice(0, MAX_DRAMAS_IN_HOME_SHORTS);
        if (candidates.length === 0) {
          if (requestId === requestIdRef.current) {
            if (cachedItemsRef.current.length > 0) {
              setItems(cachedItemsRef.current);
              setIsUsingOfflineCache(true);
            } else {
              setItems([]);
            }
            setError(null);
          }
          return;
        }

        const results = await Promise.all(
          candidates.map(async (drama) => {
            try {
              const episodes = await fetchDramaEpisodes(drama.bookId, { forceRefresh });
              const firstPlayable = episodes.find((episode) =>
                Boolean(getPreferredStreamUrl(episode))
              );
              if (!firstPlayable) return null;

              const streamUrl = getPreferredStreamUrl(firstPlayable);
              if (!streamUrl) return null;

              return {
                id: `${drama.bookId}-${firstPlayable.chapterId || firstPlayable.chapterIndex}`,
                bookId: drama.bookId,
                dramaTitle: drama.bookName,
                drama,
                episode: firstPlayable,
                streamUrl,
              } satisfies HomeShortFeedItem;
            } catch {
              return null;
            }
          })
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        const playableItems = results.filter(
          (item): item is HomeShortFeedItem => Boolean(item)
        );
        if (playableItems.length > 0) {
          setItems(playableItems);
          setError(null);
          setIsUsingOfflineCache(false);
          cachedItemsRef.current = playableItems;
          await AsyncStorage.setJson(getShortsCacheKey(category), {
            savedAt: Date.now(),
            items: playableItems,
          } satisfies HomeShortFeedCachePayload);
        } else if (cachedItemsRef.current.length > 0) {
          setItems(cachedItemsRef.current);
          setIsUsingOfflineCache(true);
          setError(null);
        } else {
          setItems([]);
          setError("Belum ada shorts yang bisa diputar.");
        }
      } catch (buildError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const fallbackItems = getOfflineItemsFromCache(
          cachedItemsRef.current,
          watchedIdsRef.current
        );

        if (fallbackItems.length > 0) {
          setItems(fallbackItems);
          setIsUsingOfflineCache(true);
          setError(null);
          return;
        }

        const message =
          buildError instanceof Error
            ? buildError.message
            : "Gagal menyiapkan feed video.";
        setError(message);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [category, dramas, isHydrated, isOnline]
  );

  useEffect(() => {
    if (!isHydrated) return;
    void buildFeed();
  }, [buildFeed, isHydrated]);

  const markAsWatched = useCallback(
    async (itemId: string) => {
      const normalizedId = itemId.trim();
      if (!normalizedId) return;
      if (watchedIdsRef.current.has(normalizedId)) return;

      watchedIdsRef.current.add(normalizedId);
      const persistedIds = Array.from(watchedIdsRef.current).slice(-WATCHED_IDS_MAX);
      watchedIdsRef.current = new Set(persistedIds);
      await AsyncStorage.setJson(WATCHED_SHORTS_IDS_KEY, persistedIds);
    },
    []
  );

  const refresh = useCallback(async () => {
    await buildFeed({ refreshing: true, forceRefresh: true });
  }, [buildFeed]);

  return {
    items,
    isLoading,
    isRefreshing,
    isUsingOfflineCache,
    error,
    markAsWatched,
    refresh,
  };
};
