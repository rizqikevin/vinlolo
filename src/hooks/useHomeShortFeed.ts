import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDramaEpisodes } from "@/src/services/dramaApi";
import { DramaEpisode, DramaItem } from "@/src/types/drama";
import { getPreferredStreamUrl } from "@/src/utils/episodes";

const MAX_DRAMAS_IN_HOME_SHORTS = 18;

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
  error: string | null;
  refresh: () => Promise<void>;
};

type BuildOptions = {
  refreshing?: boolean;
  forceRefresh?: boolean;
};

export const useHomeShortFeed = (dramas: DramaItem[]): UseHomeShortFeedResult => {
  const [items, setItems] = useState<HomeShortFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const buildFeed = useCallback(
    async ({ refreshing = false, forceRefresh = false }: BuildOptions = {}) => {
      const requestId = ++requestIdRef.current;

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const candidates = dramas.slice(0, MAX_DRAMAS_IN_HOME_SHORTS);
        if (candidates.length === 0) {
          if (requestId === requestIdRef.current) {
            setItems([]);
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
        setItems(playableItems);
        setError(null);
      } catch (buildError) {
        if (requestId !== requestIdRef.current) {
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
    [dramas]
  );

  useEffect(() => {
    void buildFeed();
  }, [buildFeed]);

  const refresh = useCallback(async () => {
    await buildFeed({ refreshing: true, forceRefresh: true });
  }, [buildFeed]);

  return { items, isLoading, isRefreshing, error, refresh };
};
