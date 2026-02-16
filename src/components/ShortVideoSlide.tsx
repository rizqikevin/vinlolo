import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
};

export const ShortVideoSlide = ({
  episode,
  streamUrl,
  dramaTitle,
  height,
  isActive,
  topInset,
  bottomInset,
}: ShortVideoSlideProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const player = useVideoPlayer({ uri: streamUrl }, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
    videoPlayer.timeUpdateEventInterval = 0;
  });

  useEffect(() => {
    const playingSub = player.addListener("playingChange", ({ isPlaying: nextPlaying }) => {
      setIsPlaying(nextPlaying);
    });

    const mutedSub = player.addListener("mutedChange", ({ muted }) => {
      setIsMuted(muted);
    });

    return () => {
      playingSub.remove();
      mutedSub.remove();
    };
  }, [player]);

  useEffect(() => {
    if (isActive) {
      player.play();
      return;
    }

    player.pause();
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

  return (
    <View style={[styles.container, { height }]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
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
});
