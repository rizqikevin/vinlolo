import {
  DramaEpisode,
  DramaItem,
  EpisodeCdn,
  EpisodeVideoPath,
  RankVo,
  TagV3,
} from "@/src/types/drama";

const API_BASE_URL = "https://dramabox.botraiki.biz/api";
const EPISODES_API_URL = "https://dramabox.botraiki.biz/api/episodes";
const REQUEST_TIMEOUT_MS = 12000;
const EPISODES_TIMEOUT_MS = 90000;
const EPISODES_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const EPISODES_CONCURRENCY_LIMIT = 10;

const episodeCache = new Map<string, { expiresAt: number; data: DramaEpisode[] }>();
let activeEpisodeRequests = 0;
const episodeRequestQueue: (() => void)[] = [];

export type DramaFeedCategory =
  | "latest"
  | "trending"
  | "for-you"
  | "vip"
  | "random"
  | "dubbed";

const DRAMA_FEED_ENDPOINT_MAP: Record<DramaFeedCategory, string> = {
  latest: "latest",
  trending: "trending",
  "for-you": "for-you",
  vip: "vip",
  random: "random",
  dubbed: "dubbed",
};

const withTimeout = (signal?: AbortSignal, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
};

const toStringSafe = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toNumberSafe = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const parseTagV3s = (value: unknown): TagV3[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;

      return {
        tagId: toNumberSafe(raw.tagId),
        tagName: toStringSafe(raw.tagName),
        tagEnName: toStringSafe(raw.tagEnName),
      };
    })
    .filter((item): item is TagV3 => Boolean(item));
};

const parseVideoPathList = (value: unknown): EpisodeVideoPath[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;

      return {
        quality: toNumberSafe(raw.quality),
        videoPath: toStringSafe(raw.videoPath),
        isDefault: toNumberSafe(raw.isDefault),
        isVipEquity: toNumberSafe(raw.isVipEquity),
      };
    })
    .filter((item): item is EpisodeVideoPath => Boolean(item))
    .filter((item) => Boolean(item.videoPath));
};

const parseCdnList = (value: unknown): EpisodeCdn[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;

      return {
        cdnDomain: toStringSafe(raw.cdnDomain),
        isDefault: toNumberSafe(raw.isDefault),
        videoPathList: parseVideoPathList(raw.videoPathList),
      };
    })
    .filter((item): item is EpisodeCdn => Boolean(item));
};

const parseRankVo = (value: unknown): RankVo | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  return {
    rankType: toNumberSafe(raw.rankType),
    hotCode: toStringSafe(raw.hotCode),
    sort: toNumberSafe(raw.sort),
  };
};

const normalizeDrama = (value: unknown): DramaItem | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const tags =
    Array.isArray(raw.tags) && raw.tags.every((item) => typeof item === "string")
      ? (raw.tags as string[])
      : [];

  return {
    bookId: toStringSafe(raw.bookId),
    bookName: toStringSafe(raw.bookName, "Tanpa Judul"),
    coverWap: toStringSafe(raw.coverWap),
    chapterCount: toNumberSafe(raw.chapterCount),
    introduction: toStringSafe(raw.introduction, "Belum ada sinopsis."),
    tags,
    tagV3s: parseTagV3s(raw.tagV3s),
    protagonist: toStringSafe(raw.protagonist, "Tidak diketahui"),
    rankVo: parseRankVo(raw.rankVo),
    shelfTime: toStringSafe(raw.shelfTime),
    inLibrary: Boolean(raw.inLibrary),
  };
};

const normalizeEpisode = (value: unknown): DramaEpisode | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  return {
    chapterId: toStringSafe(raw.chapterId),
    chapterIndex: toNumberSafe(raw.chapterIndex),
    isCharge: toNumberSafe(raw.isCharge),
    chapterName: toStringSafe(raw.chapterName),
    cdnList: parseCdnList(raw.cdnList),
    cover: toStringSafe(raw.cover),
    duration: toNumberSafe(raw.duration),
  };
};

const acquireEpisodeSlot = async () => {
  if (activeEpisodeRequests < EPISODES_CONCURRENCY_LIMIT) {
    activeEpisodeRequests += 1;
    return;
  }

  await new Promise<void>((resolve) => episodeRequestQueue.push(resolve));
  activeEpisodeRequests += 1;
};

const releaseEpisodeSlot = () => {
  activeEpisodeRequests = Math.max(0, activeEpisodeRequests - 1);
  const next = episodeRequestQueue.shift();
  if (next) next();
};

const readEpisodeCache = (bookId: string): DramaEpisode[] | null => {
  const cached = episodeCache.get(bookId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    episodeCache.delete(bookId);
    return null;
  }
  return cached.data;
};

const writeEpisodeCache = (bookId: string, data: DramaEpisode[]) => {
  episodeCache.set(bookId, {
    expiresAt: Date.now() + EPISODES_CACHE_TTL_MS,
    data,
  });
};

export const fetchLatestDramas = async (signal?: AbortSignal): Promise<DramaItem[]> => {
  return fetchDramaFeed("latest", signal);
};

export const fetchDramaFeed = async (
  category: DramaFeedCategory,
  signal?: AbortSignal
): Promise<DramaItem[]> => {
  const { signal: timeoutSignal, clear } = withTimeout(signal);

  try {
    const endpoint = DRAMA_FEED_ENDPOINT_MAP[category];
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: timeoutSignal,
    });

    if (!response.ok) {
      throw new Error(`Gagal memuat data kategori ${category}. Status: ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      throw new Error("Format respons API tidak valid.");
    }

    return payload
      .map((item) => normalizeDrama(item))
      .filter((item): item is DramaItem => Boolean(item));
  } finally {
    clear();
  }
};

export const fetchDramaEpisodes = async (
  bookId: string,
  options?: { signal?: AbortSignal; forceRefresh?: boolean }
): Promise<DramaEpisode[]> => {
  const normalizedBookId = bookId.trim();
  if (!normalizedBookId) {
    throw new Error("bookId tidak valid.");
  }

  if (!options?.forceRefresh) {
    const cached = readEpisodeCache(normalizedBookId);
    if (cached) return cached;
  }

  await acquireEpisodeSlot();
  const { signal: timeoutSignal, clear } = withTimeout(options?.signal, EPISODES_TIMEOUT_MS);
  const query = new URLSearchParams({ bookId: normalizedBookId });

  try {
    const response = await fetch(`${EPISODES_API_URL}?${query.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: timeoutSignal,
    });

    if (!response.ok) {
      throw new Error(`Gagal memuat episode. Status: ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Format respons episode tidak valid.");
    }

    const episodes = payload
      .map((item) => normalizeEpisode(item))
      .filter((item): item is DramaEpisode => Boolean(item))
      .sort((a, b) => a.chapterIndex - b.chapterIndex);

    writeEpisodeCache(normalizedBookId, episodes);
    return episodes;
  } finally {
    clear();
    releaseEpisodeSlot();
  }
};
