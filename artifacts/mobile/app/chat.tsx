import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useChat } from "@/contexts/ChatContext";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";

const EMPTY_PROMPTS = [
  "Hey, what's on your mind?",
  "Ask me anything.",
  "I'm here — talk to me.",
  "Start a conversation.",
];

const EmptyState = memo(function EmptyState({
  prompt,
  colors,
}: {
  prompt: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyOrb, { backgroundColor: colors.coral + "22" }]}>
        <Text style={[styles.emptyOrbText, { color: colors.coral }]}>A</Text>
      </View>
      <Text style={[styles.emptyName, { color: colors.ivory }]}>Aria</Text>
      <Text style={[styles.emptyPrompt, { color: colors.mutedForeground }]}>
        {prompt}
      </Text>
    </View>
  );
});

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    messages,
    isTyping,
    isSending,
    sendMessage,
    deleteMessage,
    regenerateResponse,
  } = useChat();

  const scrollRef = useRef<ScrollView>(null);
  const atBottomRef = useRef(true);
  const [prompt] = useState(
    () => EMPTY_PROMPTS[Math.floor(Math.random() * EMPTY_PROMPTS.length)]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const scrollToBottom = useCallback((animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    if (atBottomRef.current) {
      const id = setTimeout(() => scrollToBottom(true), 60);
      return () => clearTimeout(id);
    }
  }, [messages, isTyping, scrollToBottom]);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    atBottomRef.current = distFromBottom < 80;
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      atBottomRef.current = true;
      sendMessage(text);
    },
    [sendMessage]
  );

  const isEmpty = messages.length === 0 && !isTyping;

  const messageNodes = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1];
      const showAvatar =
        msg.role === "assistant" &&
        (!prev || prev.role !== "assistant");
      return (
        <ChatBubble
          key={msg.id}
          message={msg}
          showAvatar={showAvatar}
          onDelete={deleteMessage}
          onRegenerate={
            msg.role === "assistant" ? regenerateResponse : undefined
          }
        />
      );
    });
  }, [messages, deleteMessage, regenerateResponse]);

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
        <View style={styles.headerLeft}>
          <View style={[styles.avatarBig, { backgroundColor: colors.coral }]}>
            <Text style={[styles.avatarBigText, { color: colors.ivory }]}>
              A
            </Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.ivory }]}>
              Aria
            </Text>
            <View style={styles.onlineRow}>
              <View
                style={[styles.onlineDot, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={[styles.statusText, { color: colors.sage }]}>
                {isTyping ? "typing..." : "online"}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="more-vertical" size={22} color={colors.ivory} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isEmpty ? (
          <View style={styles.flex}>
            <EmptyState prompt={prompt} colors={colors} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.listContent}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (atBottomRef.current) scrollToBottom(false);
            }}
          >
            {messageNodes}
            {isTyping && <TypingIndicator />}
            <View style={styles.listBottom} />
          </ScrollView>
        )}

        <ChatInput onSend={handleSend} disabled={isSending} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBig: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBigText: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  headerName: {
    fontSize: 17,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.2,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  headerBtn: {
    padding: 8,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  listBottom: {
    height: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyOrbText: {
    fontSize: 32,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  emptyName: {
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  emptyPrompt: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
