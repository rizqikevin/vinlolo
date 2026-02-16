import { ComponentProps, useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DramaCard } from "@/src/components/DramaCard";
import { EmptyState } from "@/src/components/EmptyState";
import { FilterChip } from "@/src/components/FilterChip";
import { useDramaFeed } from "@/src/hooks/useLatestDramas";
import { AsyncStorage } from "@/src/services/asyncStorage";
import { DramaFeedCategory } from "@/src/services/dramaApi";
import { palette } from "@/src/theme/palette";
import { DramaItem } from "@/src/types/drama";
import { formatUpdatedAt } from "@/src/utils/date";

const ALL_TAGS = "Semua";
const LAST_CATEGORY_STORAGE_KEY = "last_selected_category";
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<DramaFeedCategory>("latest");
  const [isCategoryHydrated, setIsCategoryHydrated] = useState(false);
  const { dramas, isLoading, isRefreshing, error, lastUpdated, refresh } =
    useDramaFeed(selectedCategory);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(ALL_TAGS);

  const selectedCategoryLabel = useMemo(
    () =>
      CATEGORY_OPTIONS.find((item) => item.key === selectedCategory)?.label || "Terbaru",
    [selectedCategory]
  );

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    dramas.forEach((item) => {
      item.tags.forEach((tag) => {
        map.set(tag, (map.get(tag) || 0) + 1);
      });
    });

    return [ALL_TAGS, ...Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map((item) => item[0])];
  }, [dramas]);

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return dramas.filter((item) => {
      const tagMatch = selectedTag === ALL_TAGS || item.tags.includes(selectedTag);

      if (!normalizedQuery) {
        return tagMatch;
      }

      const searchable = `${item.bookName} ${item.protagonist} ${item.tags.join(" ")}`.toLowerCase();
      return tagMatch && searchable.includes(normalizedQuery);
    });
  }, [dramas, query, selectedTag]);

  useEffect(() => {
    if (selectedTag !== ALL_TAGS && !tags.includes(selectedTag)) {
      setSelectedTag(ALL_TAGS);
    }
  }, [tags, selectedTag]);

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

  const openDetail = (item: DramaItem) => {
    router.push({
      pathname: "/drama/[bookId]",
      params: {
        bookId: item.bookId,
        title: item.bookName,
        coverWap: item.coverWap,
        introduction: item.introduction,
        chapterCount: String(item.chapterCount),
        protagonist: item.protagonist,
        shelfTime: item.shelfTime,
        hotCode: item.rankVo?.hotCode || "",
        tags: item.tags.join("|"),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.bgCircle, styles.bgCircleOne]} />
      <View style={[styles.bgCircle, styles.bgCircleTwo]} />

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.bookId}
        renderItem={({ item }) => <DramaCard item={item} onPress={openDetail} />}
        refreshing={isRefreshing}
        onRefresh={refresh}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContainer,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 },
        ]}
        ListHeaderComponent={
          <>
            <Text style={styles.kicker}>DramaBox Unofficial</Text>
            <Text style={styles.title}>Drama Cina {selectedCategoryLabel}</Text>
            <Text style={styles.subtitle}>
              Kategori aktif: {selectedCategoryLabel}. Update terakhir: {formatUpdatedAt(lastUpdated)}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.tagScrollContainer}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <FilterChip
                  key={category.key}
                  label={category.label}
                  selected={category.key === selectedCategory}
                  icon={
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={14}
                      color={
                        category.key === selectedCategory
                          ? palette.textPrimary
                          : palette.textSecondary
                      }
                    />
                  }
                  onPress={() => setSelectedCategory(category.key)}
                />
              ))}
            </ScrollView>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari judul, tokoh, atau tag..."
              placeholderTextColor="#64748B"
              style={styles.searchInput}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScroll}
              contentContainerStyle={styles.tagScrollContainer}
            >
              {tags.map((tag) => (
                <FilterChip
                  key={tag}
                  label={tag}
                  selected={tag === selectedTag}
                  onPress={() => setSelectedTag(tag)}
                />
              ))}
            </ScrollView>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={palette.accentSoft} size="large" />
                <Text style={styles.loadingText}>Memuat kategori {selectedCategoryLabel}...</Text>
              </View>
            ) : null}

            {!isLoading && error && dramas.length === 0 ? (
              <EmptyState
                title="Gagal memuat data"
                description={error}
                buttonText="Coba Lagi"
                onPressButton={() => void refresh()}
              />
            ) : null}

            {!isLoading && !error && filteredData.length === 0 ? (
              <EmptyState
                title="Tidak ada hasil"
                description="Coba ubah kata kunci pencarian atau pilih tag lain."
              />
            ) : null}
          </>
        }
        ListFooterComponent={
          !isLoading && dramas.length > 0 ? (
            <Text style={styles.footerText}>Menampilkan {filteredData.length} drama</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  bgCircle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.18,
  },
  bgCircleOne: {
    width: 260,
    height: 260,
    right: -80,
    top: 40,
    backgroundColor: palette.accent,
  },
  bgCircleTwo: {
    width: 340,
    height: 340,
    left: -150,
    bottom: -80,
    backgroundColor: "#0EA5E9",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  kicker: {
    color: "#FCA5A5",
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: "900",
    color: palette.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  searchInput: {
    marginTop: 18,
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  tagScroll: {
    marginTop: 12,
    marginBottom: 14,
  },
  categoryScroll: {
    marginTop: 14,
  },
  tagScrollContainer: {
    paddingRight: 8,
  },
  loadingBox: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 14,
  },
  loadingText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontWeight: "600",
  },
  footerText: {
    marginVertical: 8,
    textAlign: "center",
    color: palette.textSecondary,
    fontSize: 12,
  },
});
