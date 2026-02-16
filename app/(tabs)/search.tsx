import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/src/components/EmptyState";
import { FilterChip } from "@/src/components/FilterChip";
import { useSearchDramas } from "@/src/hooks/useSearchDramas";
import { palette } from "@/src/theme/palette";
import { DramaItem, DramaSearchItem } from "@/src/types/drama";

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();
type SearchDisplayItem = {
  bookId: string;
  bookName: string;
  coverUrl: string;
  subtitle: string;
  description: string;
  badges: string[];
  trailing?: string;
};

const SearchCard = ({
  title,
  coverUrl,
  subtitle,
  description,
  badges,
  trailing,
  onPress,
}: {
  title: string;
  coverUrl: string;
  subtitle: string;
  description: string;
  badges: string[];
  trailing?: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
  >
    <Image source={{ uri: coverUrl }} style={styles.cardCover} contentFit="cover" transition={220} />
    <View style={styles.cardContent}>
      <View style={styles.cardTopRow}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {title}
        </Text>
        {trailing ? (
          <View style={styles.trailingBadge}>
            <Text style={styles.trailingText}>{trailing}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.cardSubtitle}>
        {subtitle}
      </Text>
      <Text numberOfLines={2} style={styles.cardDescription}>
        {description}
      </Text>
      <View style={styles.badgesRow}>
        {badges.slice(0, 3).map((item) => (
          <View key={`${title}-${item}`} style={styles.badgeItem}>
            <Text style={styles.badgeText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  </Pressable>
);

export default function SearchTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSpaces(query);
  const isQueryMode = normalizedQuery.length > 0;

  const {
    popular,
    results,
    isLoadingPopular,
    isSearching,
    popularError,
    searchError,
    refreshPopular,
  } = useSearchDramas(normalizedQuery);

  const popularTags = useMemo(() => {
    const countMap = new Map<string, number>();
    popular.forEach((item) => {
      item.tags.forEach((tag) => {
        countMap.set(tag, (countMap.get(tag) || 0) + 1);
      });
    });

    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [popular]);

  const displayItems = useMemo<SearchDisplayItem[]>(() => {
    if (isQueryMode) {
      return results.map((item: DramaSearchItem) => ({
        bookId: item.bookId,
        bookName: item.bookName,
        coverUrl: item.cover,
        subtitle: item.author || "DramaBox",
        description: item.introduction,
        badges: item.tagNames,
      }));
    }

    return popular.map((item: DramaItem, index) => ({
      bookId: item.bookId,
      bookName: item.bookName,
      coverUrl: item.coverWap,
      subtitle: `${item.chapterCount} episode`,
      description: item.introduction,
      badges: item.tags,
      trailing: item.rankVo?.hotCode || `${index + 1}`,
    }));
  }, [isQueryMode, popular, results]);

  const onPressItem = (item: SearchDisplayItem) => {
    router.push({
      pathname: "/drama/[bookId]",
      params: {
        bookId: item.bookId,
        title: item.bookName,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.bgCircle, styles.bgCircleOne]} />
      <View style={[styles.bgCircle, styles.bgCircleTwo]} />

      <FlatList
        data={displayItems}
        keyExtractor={(item) => item.bookId}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          !isQueryMode ? (
            <RefreshControl
              refreshing={isLoadingPopular}
              onRefresh={() => void refreshPopular()}
              tintColor={palette.accentSoft}
            />
          ) : undefined
        }
        ListHeaderComponent={
          <>
            <Text style={styles.kicker}>Temukan Drama</Text>
            <Text style={styles.title}>Search</Text>
            <Text style={styles.subtitle}>
              Cari judul drama, CEO, romantis, atau kata kunci lain.
            </Text>

            <View style={styles.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                style={styles.input}
                placeholder="Contoh: pewaris, cinta, romantis"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery("")}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>

            {!isQueryMode ? (
              <>
                <Text style={styles.sectionTitle}>Pencarian Populer</Text>
                <Text style={styles.sectionSubtitle}>
                  Trending topics yang paling sering dicari pengguna.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagsScroll}
                >
                  {popularTags.map((tag) => (
                    <FilterChip
                      key={tag}
                      label={tag}
                      onPress={() => setQuery(tag)}
                      icon={<MaterialCommunityIcons name="trending-up" size={14} color="#94A3B8" />}
                    />
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.resultsHead}>
                  <Text style={styles.sectionTitle}>Hasil untuk “{normalizedQuery}”</Text>
                  {isSearching ? (
                    <View style={styles.inlineLoading}>
                      <ActivityIndicator size="small" color={palette.accentSoft} />
                    </View>
                  ) : null}
                </View>
                {searchError ? (
                  <EmptyState
                    title="Pencarian gagal"
                    description={searchError}
                  />
                ) : null}
              </>
            )}

            {!isQueryMode && popularError ? (
              <EmptyState
                title="Gagal memuat popular searches"
                description={popularError}
                buttonText="Coba Lagi"
                onPressButton={() => void refreshPopular()}
              />
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <SearchCard
            title={item.bookName}
            coverUrl={item.coverUrl}
            subtitle={item.subtitle}
            description={item.description}
            badges={item.badges}
            trailing={item.trailing}
            onPress={() => onPressItem(item)}
          />
        )}
        ListEmptyComponent={
          isQueryMode ? (
            isSearching ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={palette.accentSoft} size="large" />
                <Text style={styles.loadingText}>Mencari drama...</Text>
              </View>
            ) : (
              searchError ? null : (
                <EmptyState
                  title="Tidak ditemukan"
                  description="Coba gunakan kata kunci lain."
                />
              )
            )
          ) : isLoadingPopular ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.accentSoft} size="large" />
              <Text style={styles.loadingText}>Memuat popular searches...</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isQueryMode && displayItems.length > 0 ? (
            <Text style={styles.footerText}>Menampilkan {displayItems.length} hasil</Text>
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
    opacity: 0.2,
  },
  bgCircleOne: {
    width: 240,
    height: 240,
    right: -90,
    top: 40,
    backgroundColor: palette.accent,
  },
  bgCircleTwo: {
    width: 300,
    height: 300,
    left: -140,
    bottom: 20,
    backgroundColor: "#0EA5E9",
  },
  listContent: {
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
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 8,
    color: palette.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  searchWrap: {
    marginTop: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    marginTop: 18,
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSubtitle: {
    marginTop: 5,
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  tagsScroll: {
    marginTop: 10,
    paddingRight: 10,
    paddingBottom: 8,
  },
  resultsHead: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  inlineLoading: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginTop: 10,
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    gap: 10,
  },
  cardPressed: {
    backgroundColor: palette.cardPressed,
  },
  cardCover: {
    width: 88,
    height: 122,
    borderRadius: 10,
    backgroundColor: palette.surface,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  trailingBadge: {
    borderWidth: 1,
    borderColor: palette.accentSoft,
    backgroundColor: "#7C2D12",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trailingText: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "700",
  },
  cardSubtitle: {
    marginTop: 4,
    color: "#BAE6FD",
    fontSize: 12,
    fontWeight: "700",
  },
  cardDescription: {
    marginTop: 6,
    color: palette.textSecondary,
    lineHeight: 17,
    fontSize: 12,
  },
  badgesRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badgeItem: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: palette.surface,
  },
  badgeText: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  loadingBox: {
    marginTop: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: palette.textSecondary,
    fontWeight: "600",
  },
  footerText: {
    marginVertical: 10,
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
});
