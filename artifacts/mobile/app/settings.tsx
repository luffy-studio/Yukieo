import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useModel } from "@/contexts/ModelContext";
import { useChat } from "@/contexts/ChatContext";
import { SettingsRow } from "@/components/SettingsRow";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { modelInfo, status, storageUsed, deleteModel, clearCache } = useModel();
  const { clearHistory, exportChats } = useChat();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDeleteModel = () => {
    Alert.alert(
      "Delete Model",
      "This will remove the AI model from your device. You will need to download it again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteModel();
            router.replace("/setup");
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "This will delete your entire conversation history.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearCache();
          await clearHistory();
          Alert.alert("Done", "Cache cleared.");
        },
      },
    ]);
  };

  const handleExportChats = () => {
    const data = exportChats();
    if (!data) {
      Alert.alert("No Chats", "There are no messages to export.");
      return;
    }
    Alert.alert("Export", "Chat history copied to clipboard.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryBg }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.secondaryBg,
            borderBottomColor: colors.border,
            paddingTop: topPad + 12,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={22} color={colors.ivory} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.ivory }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          AI MODEL
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="cpu"
            label="Model"
            value={modelInfo.displayName}
            showChevron={false}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="check-circle"
            label="Status"
            value={status === "ready" ? "Installed" : "Not Installed"}
            showChevron={false}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="hard-drive"
            label="Storage Usage"
            value={formatBytes(storageUsed)}
            showChevron={false}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="info"
            label="Version"
            value={modelInfo.version}
            showChevron={false}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DATA
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="download"
            label="Export Chats"
            onPress={handleExportChats}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="trash-2"
            label="Clear Cache"
            onPress={handleClearCache}
            destructive
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DANGER ZONE
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="x-circle"
            label="Delete Model"
            onPress={handleDeleteModel}
            destructive
          />
        </View>

        <View style={styles.about}>
          <Text style={[styles.aboutTitle, { color: colors.ivory }]}>Aria</Text>
          <Text style={[styles.aboutSub, { color: colors.mutedForeground }]}>
            Your personal AI companion{"\n"}Privacy-first · Fully offline
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.juniper }]}>
            <Text style={[styles.badgeText, { color: colors.sage }]}>
              {modelInfo.displayName}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
  about: {
    alignItems: "center",
    paddingTop: 48,
    gap: 8,
  },
  aboutTitle: {
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  aboutSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.4,
  },
});
