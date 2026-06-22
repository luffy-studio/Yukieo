import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Clipboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Message } from "@/contexts/ChatContext";

type Props = {
  message: Message;
  onDelete: (id: string) => void;
  onRegenerate?: () => void;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ message, onDelete, onRegenerate }: Props) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const isUser = message.role === "user";

  const handleLongPress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    const options: string[] = ["Copy", "Delete"];
    if (!isUser && onRegenerate) options.push("Regenerate");

    Alert.alert("Message", undefined, [
      {
        text: "Copy",
        onPress: () => Clipboard.setString(message.content),
      },
      ...((!isUser && onRegenerate)
        ? [{ text: "Regenerate", onPress: onRegenerate }]
        : []),
      {
        text: "Delete",
        style: "destructive" as const,
        onPress: () => onDelete(message.id),
      },
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  return (
    <Pressable onLongPress={handleLongPress} delayLongPress={400}>
      <Animated.View
        style={[
          styles.row,
          isUser ? styles.rowUser : styles.rowAI,
          { transform: [{ scale }] },
        ]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.coral }]}>
            <Text style={[styles.avatarText, { color: colors.ivory }]}>A</Text>
          </View>
        )}
        <View style={styles.bubbleWrap}>
          <View
            style={[
              styles.bubble,
              isUser
                ? [styles.bubbleUser, { backgroundColor: colors.coral }]
                : [styles.bubbleAI, { backgroundColor: colors.card }],
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: colors.ivory },
                message.isStreaming && styles.streaming,
              ]}
            >
              {message.content}
              {message.isStreaming && (
                <Text style={{ color: colors.sage }}>▍</Text>
              )}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 3,
    alignItems: "flex-end",
    gap: 8,
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAI: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  bubbleWrap: {
    maxWidth: "75%",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  streaming: {
    opacity: 0.9,
  },
  time: {
    fontSize: 11,
    marginTop: 3,
    marginHorizontal: 4,
    fontFamily: "Inter_400Regular",
  },
});
