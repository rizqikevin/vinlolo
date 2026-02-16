import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/src/components/EmptyState";
import { ShortVideoSlide } from "@/src/components/ShortVideoSlide";
import { useHomeShortFeed } from "@/src/hooks/useHomeShortFeed";
import { useDramaFeed } from "@/src/hooks/useLatestDramas";
import { AsyncStorage } from "@/src/services/asyncStorage";
import { DramaFeedCategory } from "@/src/services/dramaApi";
import { palette } from "@/src/theme/palette";

const LAST_CATEGORY_STORAGE_KEY = "last_selected_category";
const CATEGORY_TAB_WIDTH = 122;
const CATEGORY_OPTIONS: {
  key: DramaFeedCategory;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
}[] = [
  { key: "latest", label: "Terbaru", icon: "clock-outline" },
  { key: "trending", label: "Trending", icon: "fire" },
  { key: "for-you", label: "For You", icon: "thumb-up-outline" },
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
  const [selectedCategory, setSelectedCategory] = useState<DramaFeedCategory>("latest");
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
    () => CATEGORY_OPTIONS.find((item) => item.key === selectedCategory)?.label || "Terbaru",
    [selectedCategory]
  );
  const selectedCategoryIndex = useMemo(
    () => CATEGORY_OPTIONS.findIndex((item) => item.key === selectedCategory),
    [selectedCategory]
  );
  const canGoPrevCategory = selectedCategoryIndex > 0;
  const canGoNextCategory = selectedCategoryIndex < CATEGORY_OPTIONS.length - 1;
  const bottomControlsInset = Math.max(insets.bottom, tabBarHeight);

  const currentItem = shortItems[activeIndex];

  useEffect(() => {
    let mounted = true;

    const hydrateCategory = async () => {
      const savedCategory = await AsyncStorage.getItem(LAST_CATEGORY_STORAGE_KEY);
      if (savedCategory && mounted) {
        const isValid = CATEGORY_OPTIONS.some((item) => item.key === savedCategory);
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
      x: Math.max(0, selectedCategoryIndex * CATEGORY_TAB_WIDTH - CATEGORY_TAB_WIDTH),
      animated: true,
    });
  }, [selectedCategoryIndex]);

  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 80,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<(typeof shortItems)[number]>[] }) => {
      const firstVisible = viewableItems.find((item) => item.isViewable && item.index != null);
      if (typeof firstVisible?.index === "number") {
        setActiveIndex(firstVisible.index);
      }
    }
  );

  const handleRefresh = async () => {
    await Promise.all([refreshFeed(), refreshShorts()]);
  };

  const openCurrentDrama = () => {
    if (!currentItem) return;

    const drama = currentItem.drama;
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

  const selectCategoryByIndex = (index: number) => {
    const next = CATEGORY_OPTIONS[index];
    if (!next) return;
    handleSelectCategory(next.key);
  };

  const handlePrevCategory = () => {
    if (!canGoPrevCategory) return;
    selectCategoryByIndex(selectedCategoryIndex - 1);
  };

  const handleNextCategory = () => {
    if (!canGoNextCategory) return;
    selectCategoryByIndex(selectedCategoryIndex + 1);
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
        <Text style={styles.stateText}>Memuat shorts kategori {selectedCategoryLabel}...</Text>
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
          <View style={styles.headlineWrap}>
            <Text numberOfLines={1} style={styles.headline}>
              Shorts: {selectedCategoryLabel}
            </Text>
            <Text style={styles.subHeadline}>
              {Math.min(activeIndex + 1, shortItems.length)} / {shortItems.length}
            </Text>
          </View>

          <Pressable style={styles.iconButton} onPress={openCurrentDrama}>
            <MaterialCommunityIcons name="open-in-new" size={18} color="#F8FAFC" />
          </Pressable>
        </View>

        <View style={styles.categorySliderWrap}>
          <Pressable
            style={[styles.sliderNavButton, !canGoPrevCategory && styles.sliderNavButtonDisabled]}
            onPress={handlePrevCategory}
            disabled={!canGoPrevCategory}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={18}
              color={canGoPrevCategory ? "#E2E8F0" : "rgba(226, 232, 240, 0.42)"}
            />
          </Pressable>

          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {CATEGORY_OPTIONS.map((category) => {
              const isActive = category.key === selectedCategory;

              return (
                <Pressable
                  key={category.key}
                  style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                  onPress={() => handleSelectCategory(category.key)}
                >
                  <MaterialCommunityIcons
                    name={category.icon}
                    size={14}
                    color={isActive ? "#F8FAFC" : "#CBD5E1"}
                  />
                  <Text style={[styles.categoryTabLabel, isActive && styles.categoryTabLabelActive]}>
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={[styles.sliderNavButton, !canGoNextCategory && styles.sliderNavButtonDisabled]}
            onPress={handleNextCategory}
            disabled={!canGoNextCategory}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={canGoNextCategory ? "#E2E8F0" : "rgba(226, 232, 240, 0.42)"}
            />
          </Pressable>
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
  },
  headlineWrap: {
    flex: 1,
    paddingRight: 10,
  },
  headline: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
  },
  subHeadline: {
    marginTop: 2,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "600",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  categorySliderWrap: {
    marginTop: 10,
    paddingHorizontal: 8,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    flexDirection: "row",
    alignItems: "center",
  },
  sliderNavButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.52)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  sliderNavButtonDisabled: {
    backgroundColor: "rgba(15, 23, 42, 0.2)",
    borderColor: "rgba(148, 163, 184, 0.12)",
  },
  categoryTabsContent: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: "center",
  },
  categoryTab: {
    width: CATEGORY_TAB_WIDTH,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.34)",
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  categoryTabActive: {
    borderColor: "rgba(248, 250, 252, 0.66)",
    backgroundColor: "rgba(15, 23, 42, 0.88)",
  },
  categoryTabLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryTabLabelActive: {
    color: "#F8FAFC",
  },
});
