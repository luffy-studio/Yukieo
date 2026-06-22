import React, { memo, useRef } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/useColors";
import { Message } from "@/contexts/ChatContext";

type Props = {
  message: Message;
  onDelete: (id: string) => void;
  onRegenerate?: () => void;
  showAvatar?: boolean;
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatBubbleInner({ message, onDelete, onRegenerate, showAvatar = true }: Props) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const isUser = message.role === "user";

  const handleLongPress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert("Message", undefined, [
      {
        text: "Copy",
        onPress: () => Clipboard.setStringAsync(message.content),
      },
      ...(!isUser && onRegenerate
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
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={380}
      style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}
    >
      {!isUser && (
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.coral },
            !showAvatar && styles.avatarHidden,
          ]}
        >
          {showAvatar && (
            <Text style={[styles.avatarText, { color: colors.ivory }]}>A</Text>
          )}
        </View>
      )}

      <Animated.View
        style={[styles.bubbleWrap, { transform: [{ scale }] }]}
      >
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: colors.coral }]
              : [styles.bubbleAI, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}
        >
          {message.content.length > 0 && (
            <Text
              style={[styles.text, { color: colors.ivory }]}
              selectable={Platform.OS !== "web"}
            >
              {message.content}
              {message.isStreaming && (
                <Text style={{ color: colors.sage }}> ▍</Text>
              )}
            </Text>
          )}
          {message.isStreaming && message.content.length === 0 && (
            <Text style={{ color: colors.sage }}>▍</Text>
          )}
        </View>

        <Text
          style={[
            styles.time,
            { color: colors.mutedForeground },
            isUser ? styles.timeUser : styles.timeAI,
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </Animated.View>

      {isUser && <View style={styles.userSpacer} />}
    </Pressable>
  );
}

export const ChatBubble = memo(ChatBubbleInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginVertical: 2,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 18,
  },
  avatarHidden: {
    backgroundColor: "transparent",
  },
  avatarText: {
    fontSize: 12,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  bubbleWrap: {
    maxWidth: "78%",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleUser: {
    borderBottomRightRadius: 5,
  },
  bubbleAI: {
    borderBottomLeftRadius: 5,
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  timeUser: {
    textAlign: "right",
    marginRight: 4,
  },
  timeAI: {
    textAlign: "left",
    marginLeft: 4,
  },
  userSpacer: {
    width: 0,
  },
});
