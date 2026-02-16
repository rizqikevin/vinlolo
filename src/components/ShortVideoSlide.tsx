import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { DramaEpisode } from "@/src/types/drama";
import { formatDuration, getEpisodeLabel, isEpisodeVip } from "@/src/utils/episodes";

type ShortVideoSlideProps = {
  episode: DramaEpisode;
  streamUrl: string;
  dramaTitle: string;
  height: number;
  isActive: boolean;
  topInset: number;
  bottomInset: number;
  onPlaybackEnd?: () => void;
  onOpenEpisodes?: () => void;
};

export const ShortVideoSlide = ({
  episode,
  streamUrl,
  dramaTitle,
  height,
  isActive,
  topInset,
  bottomInset,
  onPlaybackEnd,
  onOpenEpisodes,
}: ShortVideoSlideProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progressWidth, setProgressWidth] = useState(0);
  const playbackRates = [0.75, 1, 1.25, 1.5, 2];

  const source = useMemo(() => ({ uri: streamUrl }), [streamUrl]);
  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = false;
    videoPlayer.timeUpdateEventInterval = 0.25;
    videoPlayer.playbackRate = 1;
  });

  useEffect(() => {
    const playingSub = player.addListener("playingChange", ({ isPlaying: nextPlaying }) => {
      setIsPlaying(nextPlaying);
    });

    const mutedSub = player.addListener("mutedChange", ({ muted }) => {
      setIsMuted(muted);
    });

    const sourceLoadSub = player.addListener("sourceLoad", ({ duration: loadedDuration }) => {
      setDuration(loadedDuration || 0);
    });

    const timeSub = player.addListener("timeUpdate", ({ currentTime: position }) => {
      setCurrentTime(position || 0);
    });
    const endedSub = player.addListener("playToEnd", () => {
      if (!isActive) return;
      onPlaybackEnd?.();
    });

    return () => {
      playingSub.remove();
      mutedSub.remove();
      sourceLoadSub.remove();
      timeSub.remove();
      endedSub.remove();
    };
  }, [isActive, onPlaybackEnd, player]);

  useEffect(() => {
    if (isActive) {
      player.play();
      return;
    }

    player.pause();
  }, [isActive, player]);

  useEffect(() => {
    if (!isActive) {
      setCurrentTime(player.currentTime || 0);
    }
  }, [isActive, player]);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
      return;
    }

    player.play();
  };

  const toggleMute = () => {
    player.muted = !isMuted;
  };

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const seekToLocationX = useCallback(
    (locationX: number) => {
      if (progressWidth <= 0 || duration <= 0) return;
      const ratio = clamp(locationX / progressWidth, 0, 1);
      const nextTime = ratio * duration;
      player.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration, progressWidth, player]
  );

  const seekPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          seekToLocationX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          seekToLocationX(event.nativeEvent.locationX);
        },
        onPanResponderRelease: () => undefined,
      }),
    [seekToLocationX]
  );

  const seekBy = (seconds: number) => {
    const target = clamp(
      (player.currentTime || 0) + seconds,
      0,
      duration > 0 ? duration : Number.MAX_SAFE_INTEGER
    );
    player.currentTime = target;
    setCurrentTime(target);
  };

  const cyclePlaybackRate = () => {
    const currentIndex = playbackRates.findIndex((rate) => rate === playbackRate);
    const nextRate = playbackRates[(currentIndex + 1) % playbackRates.length];
    player.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const progressRatio = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;

  const formatClock = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
    const total = Math.floor(seconds);
    const hour = Math.floor(total / 3600);
    const minute = Math.floor((total % 3600) / 60);
    const second = total % 60;

    if (hour > 0) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(
        second
      ).padStart(2, "0")}`;
    }

    return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { height }]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
      />

      <Pressable style={StyleSheet.absoluteFill} onPress={togglePlay}>
        {!isPlaying ? (
          <View style={styles.playOverlay}>
            <MaterialCommunityIcons name="play" size={52} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>

      <View style={[styles.overlayGradient, { paddingTop: topInset + 12, paddingBottom: bottomInset + 18 }]}>
        <View style={styles.topRow}>
          {isEpisodeVip(episode) ? (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          ) : (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          )}
          <Pressable style={styles.iconButton} onPress={toggleMute}>
            <MaterialCommunityIcons
              name={isMuted ? "volume-off" : "volume-high"}
              size={18}
              color="#F8FAFC"
            />
          </Pressable>
        </View>

        <View style={styles.bottomContent}>
          <Text numberOfLines={1} style={styles.dramaTitle}>
            {dramaTitle}
          </Text>
          <Text style={styles.episodeName}>{getEpisodeLabel(episode)}</Text>
          <Text style={styles.metaText}>
            Durasi {formatDuration(episode.duration)} • Swipe untuk episode berikutnya
          </Text>

          <View style={styles.controlsRow}>
            <Pressable style={styles.controlButton} onPress={() => seekBy(-10)}>
              <MaterialCommunityIcons name="rewind-10" size={18} color="#F8FAFC" />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={togglePlay}>
              <MaterialCommunityIcons
                name={isPlaying ? "pause" : "play"}
                size={18}
                color="#F8FAFC"
              />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={() => seekBy(10)}>
              <MaterialCommunityIcons name="fast-forward-10" size={18} color="#F8FAFC" />
            </Pressable>
            <Pressable style={styles.speedButton} onPress={cyclePlaybackRate}>
              <Text style={styles.speedText}>{playbackRate}x</Text>
            </Pressable>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatClock(currentTime)}</Text>
            <Text style={styles.timeText}>{formatClock(duration)}</Text>
          </View>

          <View style={styles.progressActionRail}>
            <View
              style={styles.progressContainer}
              onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
              {...seekPanResponder.panHandlers}
            >
              <View style={styles.progressTrack} />
              <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
              <View style={[styles.progressThumb, { left: `${progressRatio * 100}%` }]} />
            </View>

            <Pressable style={styles.watchAllButton} onPress={onOpenEpisodes}>
              <MaterialCommunityIcons name="playlist-play" size={18} color="#F8FAFC" />
              <Text style={styles.watchAllButtonText}>Tonton Semua Episode</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#000",
  },
  playOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vipBadge: {
    backgroundColor: "#451A03",
    borderWidth: 1,
    borderColor: "#D97706",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vipText: {
    color: "#FCD34D",
    fontWeight: "800",
    fontSize: 11,
  },
  freeBadge: {
    backgroundColor: "#052E16",
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  freeText: {
    color: "#86EFAC",
    fontWeight: "800",
    fontSize: 11,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
  bottomContent: {
    gap: 4,
  },
  dramaTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  episodeName: {
    color: "#F1F5F9",
    fontSize: 14,
    fontWeight: "700",
  },
  metaText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 16,
  },
  controlsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  speedButton: {
    marginLeft: "auto",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 10,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  speedText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "700",
  },
  timeRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "600",
  },
  progressActionRail: {
    marginTop: 8,
    width: "100%",
    alignSelf: "stretch",
  },
  progressContainer: {
    width: "100%",
    alignSelf: "stretch",
    height: 20,
    justifyContent: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.45)",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#F97316",
  },
  progressThumb: {
    position: "absolute",
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#F97316",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  watchAllButton: {
    marginTop: 10,
    minHeight: 40,
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  watchAllButtonText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
});
