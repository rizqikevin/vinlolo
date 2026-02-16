import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/src/theme/palette";

type FilterChipProps = {
  label: string;
  selected?: boolean;
  icon?: ReactNode;
  onPress: () => void;
};

export const FilterChip = ({ label, selected = false, icon, onPress }: FilterChipProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: palette.surface,
  },
  chipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipPressed: {
    opacity: 0.8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  labelSelected: {
    color: palette.textPrimary,
  },
});
