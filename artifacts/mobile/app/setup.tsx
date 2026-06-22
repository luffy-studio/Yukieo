import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useModel } from "@/contexts/ModelContext";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatSpeed(bps: number): string {
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  return `${Math.ceil(seconds / 60)}m`;
}

const STEPS = [
  { key: "downloading", label: "Download Model" },
  { key: "verifying", label: "Verify Files" },
  { key: "installing", label: "Install Model" },
  { key: "optimizing", label: "Optimize Device" },
  { key: "ready", label: "Ready" },
];

const STATUS_ORDER = ["not_installed", "paused", "downloading", "verifying", "installing", "optimizing", "ready"];

function stepIndex(status: string): number {
  const map: Record<string, number> = {
    downloading: 0,
    paused: 0,
    verifying: 1,
    installing: 2,
    optimizing: 3,
    ready: 4,
  };
  return map[status] ?? -1;
}

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    status,
    progress,
    downloadedBytes,
    totalBytes,
    downloadSpeed,
    eta,
    modelInfo,
    startDownload,
    pauseDownload,
    resumeDownload,
    retryDownload,
  } = useModel();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [glowAnim]);

  useEffect(() => {
    if (status === "ready") {
      setTimeout(() => router.replace("/chat"), 800);
    }
  }, [status]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const currentStep = stepIndex(status);
  const isActive = ["downloading", "verifying", "installing", "optimizing"].includes(status);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.primaryBg,
          paddingTop: topPad + 24,
          paddingBottom: botPad + 24,
        },
      ]}
    >
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.glowOrb,
            { backgroundColor: colors.coral, opacity: glowAnim },
          ]}
        />
        <Text style={[styles.title, { color: colors.ivory }]}>
          Preparing Your{"\n"}AI Companion
        </Text>
        <Text style={[styles.subtitle, { color: colors.sage }]}>
          {modelInfo.displayName} · {formatBytes(totalBytes)}
        </Text>
      </View>

      <View style={styles.body}>
        {STEPS.map((step, i) => {
          const done = currentStep > i || status === "ready";
          const active = currentStep === i && isActive;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: done
                      ? colors.coral
                      : active
                      ? colors.coral + "60"
                      : colors.muted,
                    borderColor: active ? colors.coral : "transparent",
                    borderWidth: active ? 2 : 0,
                  },
                ]}
              />
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: done ? colors.coral + "60" : colors.border },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: done
                      ? colors.ivory
                      : active
                      ? colors.ivory
                      : colors.mutedForeground,
                    fontFamily: active
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {(isActive || status === "paused") && (
        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.coral,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <Text style={[styles.stat, { color: colors.mutedForeground }]}>
              {progress.toFixed(0)}%
            </Text>
            <Text style={[styles.stat, { color: colors.mutedForeground }]}>
              {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
            </Text>
          </View>

          {status === "downloading" && (
            <View style={styles.statsRow}>
              <Text style={[styles.stat, { color: colors.sage }]}>
                {formatSpeed(downloadSpeed)}
              </Text>
              <Text style={[styles.stat, { color: colors.sage }]}>
                ETA {formatEta(eta)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        {status === "not_installed" && (
          <Pressable
            onPress={startDownload}
            style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.coral }]}
          >
            <Text style={[styles.btnText, { color: colors.ivory }]}>
              Download Model
            </Text>
          </Pressable>
        )}

        {status === "downloading" && (
          <Pressable
            onPress={pauseDownload}
            style={[styles.btn, styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={[styles.btnText, { color: colors.ivory }]}>Pause</Text>
          </Pressable>
        )}

        {status === "paused" && (
          <View style={styles.btnGroup}>
            <Pressable
              onPress={resumeDownload}
              style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.coral, flex: 1 }]}
            >
              <Text style={[styles.btnText, { color: colors.ivory }]}>Resume</Text>
            </Pressable>
            <Pressable
              onPress={retryDownload}
              style={[styles.btn, styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.card, flex: 1 }]}
            >
              <Text style={[styles.btnText, { color: colors.ivory }]}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  glowOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.4,
  },
  body: {
    marginBottom: 40,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 14,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  stepLine: {
    position: "absolute",
    left: 5,
    top: 12,
    width: 2,
    height: 32,
    zIndex: -1,
  },
  stepLabel: {
    fontSize: 15,
    paddingVertical: 10,
  },
  progressSection: {
    marginBottom: 32,
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  actions: {
    gap: 12,
  },
  btnGroup: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnPrimary: {},
  btnSecondary: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
