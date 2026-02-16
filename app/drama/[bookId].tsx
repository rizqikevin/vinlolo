import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/src/components/EmptyState";
import { ShortVideoSlide } from "@/src/components/ShortVideoSlide";
import { useDramaEpisodes } from "@/src/hooks/useDramaEpisodes";
import { palette } from "@/src/theme/palette";
import { DramaEpisode } from "@/src/types/drama";
import { getPreferredStreamUrl } from "@/src/utils/episodes";

const readParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

type PlayableEpisode = {
  episode: DramaEpisode;
  streamUrl: string;
};

export default function DramaShortsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);

  const bookId = readParam(params.bookId);
  const title = readParam(params.title) || "Drama Shorts";

  const { episodes, isLoading, isRefreshing, error, refresh } = useDramaEpisodes(bookId);

  const playableEpisodes = useMemo<PlayableEpisode[]>(
    () =>
      episodes
        .map((episode) => {
          const streamUrl = getPreferredStreamUrl(episode);
          if (!streamUrl) return null;
          return { episode, streamUrl };
        })
        .filter((item): item is PlayableEpisode => Boolean(item)),
    [episodes]
  );

  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 80,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<PlayableEpisode>[] }) => {
      const firstVisible = viewableItems.find((item) => item.isViewable && item.index != null);
      if (typeof firstVisible?.index === "number") {
        setActiveIndex(firstVisible.index);
      }
    }
  );

  if (!bookId) {
    return (
      <View style={styles.stateScreen}>
        <EmptyState
          title="bookId tidak ditemukan"
          description="Buka drama dari halaman utama untuk mulai menonton."
        />
      </View>
    );
  }

  if (isLoading && playableEpisodes.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator size="large" color={palette.accentSoft} />
        <Text style={styles.loadingText}>Memuat video shorts...</Text>
      </View>
    );
  }

  if (error && playableEpisodes.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <EmptyState
          title="Gagal memuat video"
          description={error}
          buttonText="Coba Lagi"
          onPressButton={() => void refresh()}
        />
      </View>
    );
  }

  if (!isLoading && playableEpisodes.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <EmptyState
          title="Video tidak tersedia"
          description="Episode ada, tapi belum ada stream URL yang bisa diputar."
          buttonText={isRefreshing ? "Memuat..." : "Refresh"}
          onPressButton={() => void refresh()}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <FlatList
        data={playableEpisodes}
        keyExtractor={(item) => item.episode.chapterId || `${item.episode.chapterIndex}`}
        renderItem={({ item, index }) => (
          <ShortVideoSlide
            episode={item.episode}
            streamUrl={item.streamUrl}
            dramaTitle={title}
            height={height}
            isActive={index === activeIndex}
            topInset={insets.top}
            bottomInset={insets.bottom}
          />
        )}
        pagingEnabled
        decelerationRate="fast"
        disableIntervalMomentum
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfigRef.current}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.topIconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#F8FAFC" />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={styles.topTitle}>
            {title}
          </Text>
          <Text style={styles.topSubtitle}>
            {activeIndex + 1} / {playableEpisodes.length}
          </Text>
        </View>
        <Pressable style={styles.topIconButton} onPress={() => void refresh()}>
          <MaterialCommunityIcons
            name={isRefreshing ? "progress-clock" : "refresh"}
            size={20}
            color="#F8FAFC"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  stateScreen: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 10,
    textAlign: "center",
    color: palette.textSecondary,
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  topIconButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  topTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  topSubtitle: {
    color: "#CBD5E1",
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
});
