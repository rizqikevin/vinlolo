import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/src/theme/palette";
import { DramaEpisode } from "@/src/types/drama";
import {
  formatDuration,
  getEpisodeLabel,
  getEpisodeStreams,
  isEpisodeVip,
} from "@/src/utils/episodes";

type EpisodeCardProps = {
  episode: DramaEpisode;
  onOpenStream: (url: string) => void;
};

export const EpisodeCard = memo(({ episode, onOpenStream }: EpisodeCardProps) => {
  const streams = useMemo(() => getEpisodeStreams(episode), [episode]);
  const vip = isEpisodeVip(episode);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{getEpisodeLabel(episode)}</Text>
        <View style={styles.badges}>
          {vip ? (
            <View style={[styles.badge, styles.vipBadge]}>
              <Text style={[styles.badgeText, styles.vipText]}>VIP</Text>
            </View>
          ) : null}
          <View style={[styles.badge, styles.durationBadge]}>
            <Text style={styles.badgeText}>{formatDuration(episode.duration)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.subText}>Streaming link:</Text>

      <View style={styles.streamRow}>
        {streams.map((stream) => (
          <Pressable
            key={`${episode.chapterId}-${stream.quality}-${stream.videoPath}`}
            onPress={() => onOpenStream(stream.videoPath)}
            style={({ pressed }) => [
              styles.streamButton,
              stream.isDefault && styles.defaultButton,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.streamText,
                stream.isDefault && styles.defaultButtonText,
              ]}
            >
              {stream.quality}p
              {stream.isVipEquity ? " VIP" : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {streams.length === 0 ? (
        <Text style={styles.unavailableText}>Link stream belum tersedia.</Text>
      ) : null}

      {streams[0] ? (
        <Text selectable numberOfLines={1} style={styles.urlPreview}>
          {streams[0].videoPath}
        </Text>
      ) : null}
    </View>
  );
});

EpisodeCard.displayName = "EpisodeCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  vipBadge: {
    borderColor: "#B45309",
    backgroundColor: "#451A03",
  },
  vipText: {
    color: "#FCD34D",
  },
  durationBadge: {
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  badgeText: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  subText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  streamRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  streamButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  defaultButton: {
    borderColor: palette.accentSoft,
    backgroundColor: "#7C2D12",
  },
  pressed: {
    opacity: 0.8,
  },
  streamText: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  defaultButtonText: {
    color: "#FDBA74",
  },
  unavailableText: {
    marginTop: 8,
    color: palette.textSecondary,
    fontSize: 12,
  },
  urlPreview: {
    marginTop: 8,
    color: "#93C5FD",
    fontSize: 11,
  },
});
