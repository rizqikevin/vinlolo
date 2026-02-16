import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/src/theme/palette";

type EmptyStateProps = {
  title: string;
  description: string;
  buttonText?: string;
  onPressButton?: () => void;
};

export const EmptyState = ({
  title,
  description,
  buttonText,
  onPressButton,
}: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {buttonText && onPressButton ? (
        <Pressable onPress={onPressButton} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  description: {
    color: palette.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    marginTop: 14,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
});
