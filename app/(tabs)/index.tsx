import { EmptyState } from "@/src/components/EmptyState";
import { ShortVideoSlide } from "@/src/components/ShortVideoSlide";
import { useHomeShortFeed } from "@/src/hooks/useHomeShortFeed";
import { useDramaFeed } from "@/src/hooks/useLatestDramas";
import { AsyncStorage } from "@/src/services/asyncStorage";
import { DramaFeedCategory } from "@/src/services/dramaApi";
import { palette } from "@/src/theme/palette";
import { DramaItem } from "@/src/types/drama";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LAST_CATEGORY_STORAGE_KEY = "last_selected_category";
const CATEGORY_SLIDE_WIDTH = 114;
const CATEGORY_OPTIONS: {
  key: DramaFeedCategory;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
}[] = [
  { key: "for-you", label: "FYP", icon: "cards-heart-outline" },
  { key: "trending", label: "Teman", icon: "account-group-outline" },
  { key: "latest", label: "Terbaru", icon: "clock-outline" },
  { key: "vip", label: "VIP", icon: "crown-outline" },
  { key: "random", label: "Random", icon: "shuffle-variant" },
  { key: "dubbed", label: "Dubbed", icon: "microphone-outline" },
];

export default function Index() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] =
    useState<DramaFeedCategory>("for-you");
  const [isCategoryHydrated, setIsCategoryHydrated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const categoryScrollRef = useRef<ScrollView>(null);

  const {
    dramas,
    isLoading: isLoadingFeed,
    isRefreshing: isRefreshingFeed,
    error: feedError,
    refresh: refreshFeed,
  } = useDramaFeed(selectedCategory);

  const {
    items: shortItems,
    isLoading: isLoadingShorts,
    isRefreshing: isRefreshingShorts,
    error: shortsError,
    refresh: refreshShorts,
  } = useHomeShortFeed(dramas);
  const shortsListRef = useRef<FlatList<(typeof shortItems)[number]>>(null);

  const selectedCategoryLabel = useMemo(
    () =>
      CATEGORY_OPTIONS.find((item) => item.key === selectedCategory)?.label ||
      "Terbaru",
    [selectedCategory],
  );
  const selectedCategoryIndex = useMemo(
    () => CATEGORY_OPTIONS.findIndex((item) => item.key === selectedCategory),
    [selectedCategory],
  );
  const bottomControlsInset = Math.max(insets.bottom, tabBarHeight);

  useEffect(() => {
    let mounted = true;

    const hydrateCategory = async () => {
      const savedCategory = await AsyncStorage.getItem(
        LAST_CATEGORY_STORAGE_KEY,
      );
      if (savedCategory && mounted) {
        const isValid = CATEGORY_OPTIONS.some(
          (item) => item.key === savedCategory,
        );
        if (isValid) {
          setSelectedCategory(savedCategory as DramaFeedCategory);
        }
      }

      if (mounted) {
        setIsCategoryHydrated(true);
      }
    };

    void hydrateCategory();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isCategoryHydrated) return;
    void AsyncStorage.setItem(LAST_CATEGORY_STORAGE_KEY, selectedCategory);
  }, [selectedCategory, isCategoryHydrated]);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategoryIndex < 0) return;
    categoryScrollRef.current?.scrollTo({
      x: Math.max(
        0,
        selectedCategoryIndex * CATEGORY_SLIDE_WIDTH - CATEGORY_SLIDE_WIDTH,
      ),
      animated: true,
    });
  }, [selectedCategoryIndex]);

  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 80,
  });

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<(typeof shortItems)[number]>[];
    }) => {
      const firstVisible = viewableItems.find(
        (item) => item.isViewable && item.index != null,
      );
      if (typeof firstVisible?.index === "number") {
        setActiveIndex(firstVisible.index);
      }
    },
  );

  const handleRefresh = async () => {
    await Promise.all([refreshFeed(), refreshShorts()]);
  };

  const openDrama = (drama: DramaItem) => {
    router.push({
      pathname: "/drama/[bookId]",
      params: {
        bookId: drama.bookId,
        title: drama.bookName,
        coverWap: drama.coverWap,
        introduction: drama.introduction,
        chapterCount: String(drama.chapterCount),
        protagonist: drama.protagonist,
        shelfTime: drama.shelfTime,
        hotCode: drama.rankVo?.hotCode || "",
        tags: drama.tags.join("|"),
      },
    });
  };

  const handleSelectCategory = (category: DramaFeedCategory) => {
    setSelectedCategory(category);
  };

  const handlePlaybackEnd = (index: number) => {
    if (!isFocused || index !== activeIndex) return;

    const nextIndex = index + 1;
    if (nextIndex >= shortItems.length) return;

    setActiveIndex(nextIndex);
    shortsListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  if ((isLoadingFeed || isLoadingShorts) && shortItems.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <StatusBar style="light" />
        <ActivityIndicator color={palette.accentSoft} size="large" />
        <Text style={styles.stateText}>
          Memuat shorts kategori {selectedCategoryLabel}...
        </Text>
      </View>
    );
  }

  if (feedError && dramas.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <StatusBar style="light" />
        <EmptyState
          title="Gagal memuat kategori"
          description={feedError}
          buttonText="Coba Lagi"
          onPressButton={() => void refreshFeed()}
        />
      </View>
    );
  }

  if (!isLoadingShorts && shortsError && shortItems.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <StatusBar style="light" />
        <EmptyState
          title="Gagal menyiapkan shorts"
          description={shortsError}
          buttonText="Coba Lagi"
          onPressButton={() => void refreshShorts()}
        />
      </View>
    );
  }

  if (!isLoadingShorts && shortItems.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <StatusBar style="light" />
        <EmptyState
          title="Shorts belum tersedia"
          description="Kategori ini belum memiliki stream video yang bisa diputar."
          buttonText="Refresh"
          onPressButton={() => void handleRefresh()}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <FlatList
        ref={shortsListRef}
        data={shortItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ShortVideoSlide
            episode={item.episode}
            streamUrl={item.streamUrl}
            dramaTitle={item.dramaTitle}
            height={height}
            isActive={isFocused && index === activeIndex}
            topInset={insets.top}
            bottomInset={bottomControlsInset}
            onPlaybackEnd={() => handlePlaybackEnd(index)}
            onOpenEpisodes={() => openDrama(item.drama)}
          />
        )}
        pagingEnabled={true}
        decelerationRate="fast"
        disableIntervalMomentum
        snapToInterval={height}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
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
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            shortsListRef.current?.scrollToIndex({
              index,
              animated: true,
            });
          }, 150);
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingFeed || isRefreshingShorts}
            onRefresh={() => void handleRefresh()}
            tintColor={palette.accentSoft}
          />
        }
      />

      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topHeaderRow}>
          <Text style={styles.headerTitle}>
            Shorts • {selectedCategoryLabel}
          </Text>
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {Math.min(activeIndex + 1, shortItems.length)} /{" "}
              {shortItems.length}
            </Text>
          </View>
        </View>

        <View style={styles.categorySliderWrap}>
          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categorySliderContent}
          >
            {CATEGORY_OPTIONS.map((category) => {
              const isActive = category.key === selectedCategory;

              return (
                <Pressable
                  key={category.key}
                  style={[
                    styles.categorySlideItem,
                    isActive && styles.categorySlideItemActive,
                  ]}
                  onPress={() => handleSelectCategory(category.key)}
                >
                  <MaterialCommunityIcons
                    name={category.icon}
                    size={14}
                    color={isActive ? "#F8FAFC" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.categorySlideText,
                      isActive && styles.categorySlideTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
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
  stateText: {
    marginTop: 10,
    textAlign: "center",
    color: palette.textSecondary,
    fontWeight: "600",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
  },
  counterPill: {
    minWidth: 62,
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  counterText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
  },
  categorySliderWrap: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    paddingVertical: 6,
  },
  categorySliderContent: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: "center",
  },
  categorySlideItem: {
    width: CATEGORY_SLIDE_WIDTH,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  categorySlideItemActive: {
    borderColor: "rgba(248, 250, 252, 0.52)",
    backgroundColor: "rgba(30, 41, 59, 0.88)",
  },
  categorySlideText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  categorySlideTextActive: {
    color: "#F8FAFC",
  },
});
