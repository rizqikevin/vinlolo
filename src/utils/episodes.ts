import { DramaEpisode } from "@/src/types/drama";

const toBool = (value: number) => value === 1;

export type EpisodeStream = {
  quality: number;
  videoPath: string;
  isDefault: boolean;
  isVipEquity: boolean;
};

export const getEpisodeStreams = (episode: DramaEpisode): EpisodeStream[] => {
  const streams: EpisodeStream[] = [];

  for (const cdn of episode.cdnList) {
    for (const path of cdn.videoPathList) {
      if (!path.videoPath) continue;

      streams.push({
        quality: path.quality,
        videoPath: path.videoPath,
        isDefault: toBool(path.isDefault) || toBool(cdn.isDefault),
        isVipEquity: toBool(path.isVipEquity),
      });
    }
  }

  const uniqueMap = new Map<string, EpisodeStream>();
  streams.forEach((stream) => {
    if (!uniqueMap.has(stream.videoPath)) {
      uniqueMap.set(stream.videoPath, stream);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    return b.quality - a.quality;
  });
};

export const getPreferredStreamUrl = (episode: DramaEpisode): string | null => {
  const preferred = getEpisodeStreams(episode)[0];
  return preferred?.videoPath || null;
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const getEpisodeLabel = (episode: DramaEpisode): string =>
  episode.chapterName || `EP ${episode.chapterIndex + 1}`;

export const isEpisodeVip = (episode: DramaEpisode): boolean => episode.isCharge === 1;
