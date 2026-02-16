import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "@/src/components/EmptyState";
import { EpisodeCard } from "@/src/components/EpisodeCard";
import { useDramaEpisodes } from "@/src/hooks/useDramaEpisodes";
import { palette } from "@/src/theme/palette";
import { DramaEpisode } from "@/src/types/drama";
import { formatShelfTime } from "@/src/utils/date";
import { getPreferredStreamUrl } from "@/src/utils/episodes";

const readParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

export default function DramaDetailScreen() {
  const params = useLocalSearchParams();

  const bookId = readParam(params.bookId);
  const title = readParam(params.title);
  const coverWap = readParam(params.coverWap);
  const introduction = readParam(params.introduction);
  const chapterCount = readParam(params.chapterCount);
  const protagonist = readParam(params.protagonist);
  const shelfTime = readParam(params.shelfTime);
  const hotCode = readParam(params.hotCode);
  const tagsRaw = readParam(params.tags);
  const tags = tagsRaw ? tagsRaw.split("|").filter(Boolean) : [];

  const { episodes, isLoading, isRefreshing, error, refresh } = useDramaEpisodes(bookId);

  const firstStreamUrl = useMemo(() => {
    for (const episode of episodes) {
      const url = getPreferredStreamUrl(episode);
      if (url) return url;
    }
    return null;
  }, [episodes]);

  const openStream = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Gagal", "Link video tidak bisa dibuka di perangkat ini.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Gagal", "Terjadi error saat membuka link stream.");
    }
  };

  const handlePlay = () => {
    if (!firstStreamUrl) {
      Alert.alert("Info", "Link streaming belum tersedia.");
      return;
    }

    void openStream(firstStreamUrl);
  };

  const renderEpisode = ({ item }: { item: DramaEpisode }) => (
    <EpisodeCard episode={item} onOpenStream={(url) => void openStream(url)} />
  );

  if (!bookId) {
    return (
      <View style={styles.screen}>
        <View style={styles.stateContainer}>
          <EmptyState
            title="bookId tidak ditemukan"
            description="Buka detail drama dari halaman utama."
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={episodes}
      keyExtractor={(item) => item.chapterId || `${item.chapterIndex}`}
      renderItem={renderEpisode}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void refresh()}
          tintColor={palette.accentSoft}
        />
      }
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View>
          <Image
            source={{ uri: coverWap }}
            style={styles.cover}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.hotBadge}>
            <Text style={styles.hotText}>{hotCode || "Baru"}</Text>
          </View>

          <Text style={styles.title}>{title || "Detail Drama"}</Text>
          <Text style={styles.metaText}>
            {chapterCount || "-"} episode • {formatShelfTime(shelfTime)}
          </Text>
          <Text style={styles.protagonist}>Tokoh utama: {protagonist || "-"}</Text>

          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Sinopsis</Text>
          <Text style={styles.synopsis}>{introduction || "Sinopsis belum tersedia."}</Text>

          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
          >
            <Text style={styles.playText}>Mainkan Episode Pertama</Text>
          </Pressable>

          <Text style={styles.episodeTitle}>Daftar Episode & Streaming Link</Text>
          <Text style={styles.episodeSubtitle}>
            Mengambil semua episode gratis dan VIP. Drama panjang bisa butuh 30-60 detik.
          </Text>

          {isLoading && episodes.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={palette.accentSoft} size="large" />
              <Text style={styles.loadingText}>Memuat episode dan link streaming...</Text>
            </View>
          ) : null}

          {error && episodes.length === 0 ? (
            <EmptyState
              title="Gagal memuat episode"
              description={error}
              buttonText="Coba Lagi"
              onPressButton={() => void refresh()}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoading && !error ? (
          <EmptyState
            title="Belum ada episode"
            description="Data episode untuk drama ini tidak tersedia."
          />
        ) : null
      }
      ListFooterComponent={
        episodes.length > 0 ? (
          <Text style={styles.footerText}>
            Total {episodes.length} episode tersedia
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  stateContainer: {
    padding: 16,
    paddingTop: 20,
  },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: palette.surface,
  },
  hotBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "#7C2D12",
    borderColor: palette.accentSoft,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hotText: {
    color: "#FDBA74",
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    marginTop: 12,
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: "900",
  },
  metaText: {
    marginTop: 8,
    color: palette.textSecondary,
    fontSize: 13,
  },
  protagonist: {
    marginTop: 8,
    color: "#BAE6FD",
    fontSize: 13,
    fontWeight: "700",
  },
  tagsContainer: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: palette.textSecondary,
    fontWeight: "600",
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 22,
    fontSize: 18,
    fontWeight: "800",
    color: palette.textPrimary,
  },
  synopsis: {
    marginTop: 10,
    color: palette.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
  playButton: {
    marginTop: 24,
    borderRadius: 14,
    backgroundColor: palette.accent,
    paddingVertical: 14,
    alignItems: "center",
  },
  playButtonPressed: {
    opacity: 0.85,
  },
  playText: {
    color: palette.textPrimary,
    fontWeight: "800",
    fontSize: 15,
  },
  episodeTitle: {
    marginTop: 24,
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  episodeSubtitle: {
    marginTop: 6,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  loadingContainer: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontWeight: "600",
  },
  footerText: {
    marginTop: 8,
    textAlign: "center",
    color: palette.textSecondary,
    fontSize: 12,
  },
});
