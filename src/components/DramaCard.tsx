import { memo } from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DramaItem } from "@/src/types/drama";
import { palette } from "@/src/theme/palette";
import { formatShelfTime } from "@/src/utils/date";

type DramaCardProps = {
  item: DramaItem;
  onPress: (item: DramaItem) => void;
};

export const DramaCard = memo(({ item, onPress }: DramaCardProps) => {
  return (
    <Pressable onPress={() => onPress(item)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Image
        source={{ uri: item.coverWap }}
        style={styles.cover}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={2} style={styles.title}>
            {item.bookName}
          </Text>
          <View style={styles.hotBadge}>
            <Text style={styles.hotText}>{item.rankVo?.hotCode || "Baru"}</Text>
          </View>
        </View>

        <Text style={styles.protagonist} numberOfLines={1}>
          {item.protagonist}
        </Text>
        <Text numberOfLines={3} style={styles.introduction}>
          {item.introduction}
        </Text>

        <View style={styles.tagRow}>
          {item.tags.slice(0, 2).map((tag) => (
            <View key={`${item.bookId}-${tag}`} style={styles.tagItem}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.metaText}>{item.chapterCount} episode</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{formatShelfTime(item.shelfTime)}</Text>
        </View>
      </View>
    </Pressable>
  );
});

DramaCard.displayName = "DramaCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    marginBottom: 14,
    flexDirection: "row",
    gap: 12,
  },
  cardPressed: {
    backgroundColor: palette.cardPressed,
  },
  cover: {
    width: 106,
    height: 148,
    borderRadius: 12,
    backgroundColor: palette.surfaceElevated,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  title: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  hotBadge: {
    backgroundColor: "#7C2D12",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.accentSoft,
  },
  hotText: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "700",
  },
  protagonist: {
    marginTop: 2,
    color: "#BAE6FD",
    fontSize: 12,
    fontWeight: "700",
  },
  introduction: {
    marginTop: 7,
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 6,
  },
  tagItem: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: palette.surface,
  },
  tagText: {
    color: palette.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: palette.textSecondary,
    fontSize: 11,
  },
  metaDot: {
    color: palette.textSecondary,
    marginHorizontal: 7,
    fontSize: 11,
  },
});
