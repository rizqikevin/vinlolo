import { palette } from "@/src/theme/palette";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const APP_NAME = "Vinlolo";
const APP_TAGLINE = "Short Drama Streaming App";

const APP_DESCRIPTION =
  "Vinlolo adalah aplikasi multi-platform untuk menonton drama pendek vertikal dengan pengalaman scroll cepat, UI modern, dan pemutaran episode yang lancar.";

const FEATURES = [
  {
    icon: "play-circle-outline" as const,
    title: "Vertical Shorts Experience",
    description:
      "Tonton drama format portrait seperti TikTok/Reels dengan navigasi swipe per episode.",
  },
  {
    icon: "magnify" as const,
    title: "Pencarian Cepat",
    description:
      "Temukan drama berdasarkan kata kunci dan trending searches secara instan.",
  },
  {
    icon: "playlist-play" as const,
    title: "Daftar Episode Lengkap",
    description:
      "Buka seluruh daftar episode dan lanjutkan menonton tanpa pindah aplikasi.",
  },
  {
    icon: "cellphone-link" as const,
    title: "iOS & Android Ready",
    description:
      "Dibangun dengan Expo React Native untuk performa dan pengembangan multi-platform.",
  },
];

const TEAM_INFO = {
  creator: "Rizqi Kevin Octavian",
  role: "Frontend Developer & Mobile Developer",
  studio: "Serang",
  location: "Indonesia",
};

const SOCIAL_LINKS = [
  {
    label: "Website",
    value: "My personal website",
    icon: "web",
    url: "https://rizqikevin.github.io",
  },
  {
    label: "Email",
    value: "rizqikevino@gmail.com",
    icon: "email-outline",
    url: "mailto:rizqikevino@gmail",
  },
  {
    label: "Instagram",
    value: "@rizqikevin_",
    icon: "instagram",
    url: "https://instagram.com/rizqikevin_",
  },
  {
    label: "TikTok",
    value: "@rizqikevin",
    icon: "music-note-outline",
    url: "https://www.tiktok.com/rizqikevin",
  },
  {
    label: "YouTube",
    value: "@rizqikevin",
    icon: "youtube",
    url: "https://youtube.com/rizqikevin",
  },
] as const;

const openExternalLink = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        "Link tidak valid",
        "URL tidak dapat dibuka di perangkat ini.",
      );
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("Gagal membuka link", "Silakan coba lagi.");
  }
};

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const appId =
    Constants.expoConfig?.ios?.bundleIdentifier ||
    Constants.expoConfig?.android?.package ||
    "com.vinlolo.app";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 14,
            paddingBottom: insets.bottom + 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.appLogo}>
            <MaterialCommunityIcons
              name="movie-open-play-outline"
              size={26}
              color="#F8FAFC"
            />
          </View>
          <Text style={styles.kicker}>About Application</Text>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          <Text style={styles.description}>{APP_DESCRIPTION}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitur Utama</Text>
          {FEATURES.map((item) => (
            <View key={item.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color="#F8FAFC"
                />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDescription}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creator & Developer</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color="#F8FAFC"
              />
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName}>{TEAM_INFO.creator}</Text>
              <Text style={styles.profileRole}>{TEAM_INFO.role}</Text>
              <Text style={styles.profileMeta}>
                {TEAM_INFO.studio} • {TEAM_INFO.location}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontak & Sosial Media</Text>
          {SOCIAL_LINKS.map((social) => (
            <Pressable
              key={social.label}
              style={({ pressed }) => [
                styles.socialCard,
                pressed && styles.socialCardPressed,
              ]}
              onPress={() => void openExternalLink(social.url)}
            >
              <View style={styles.socialLeft}>
                <View style={styles.socialIcon}>
                  <MaterialCommunityIcons
                    name={social.icon}
                    size={18}
                    color="#F8FAFC"
                  />
                </View>
                <View>
                  <Text style={styles.socialLabel}>{social.label}</Text>
                  <Text style={styles.socialValue}>{social.value}</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="open-in-new"
                size={16}
                color="#94A3B8"
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Aplikasi</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versi</Text>
              <Text style={styles.infoValue}>v{appVersion}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Identifier</Text>
              <Text style={styles.infoValue}>{appId}</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            Data konten drama di aplikasi ini menggunakan endpoint pihak ketiga
            sesuai integrasi backend.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 16,
  },
  appLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    marginTop: 12,
    color: "#FDA4AF",
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  appName: {
    marginTop: 6,
    color: palette.textPrimary,
    fontSize: 30,
    fontWeight: "900",
  },
  tagline: {
    marginTop: 2,
    color: "#BAE6FD",
    fontSize: 13,
    fontWeight: "700",
  },
  description: {
    marginTop: 10,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  featureCard: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  featureDescription: {
    marginTop: 2,
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  profileCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(14, 165, 233, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  profileRole: {
    marginTop: 2,
    color: "#BAE6FD",
    fontSize: 12,
    fontWeight: "700",
  },
  profileMeta: {
    marginTop: 3,
    color: palette.textSecondary,
    fontSize: 12,
  },
  socialCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  socialCardPressed: {
    backgroundColor: palette.surfaceElevated,
  },
  socialLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(30, 64, 175, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  socialLabel: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  socialValue: {
    marginTop: 1,
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  infoLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  infoDivider: {
    marginVertical: 10,
    height: 1,
    backgroundColor: palette.border,
  },
  disclaimer: {
    marginTop: 10,
    color: palette.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});
