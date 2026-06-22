import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useChat, Message } from "@/contexts/ChatContext";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";

const EMPTY_PROMPTS = [
  "Hey, what's on your mind?",
  "Ask me anything.",
  "I'm here — talk to me.",
  "Start a conversation.",
];

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, isTyping, sendMessage, deleteMessage, regenerateResponse } = useChat();
  const flatListRef = useRef<FlatList<Message>>(null);
  const [prompt] = useState(
    () => EMPTY_PROMPTS[Math.floor(Math.random() * EMPTY_PROMPTS.length)]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble
        message={item}
        onDelete={deleteMessage}
        onRegenerate={item.role === "assistant" ? regenerateResponse : undefined}
      />
    ),
    [deleteMessage, regenerateResponse]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const ListHeaderComponent = isTyping ? <TypingIndicator /> : null;

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
            <Text style={[styles.avatarBigText, { color: colors.ivory }]}>A</Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.ivory }]}>Aria</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: "#4CAF50" }]} />
              <Text style={[styles.onlineText, { color: colors.sage }]}>Online</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="more-vertical" size={22} color={colors.ivory} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 && !isTyping ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyOrb, { backgroundColor: colors.coral + "20" }]}>
              <Text style={[styles.emptyOrbText, { color: colors.coral }]}>A</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.ivory }]}>Aria</Text>
            <Text style={[styles.emptyPrompt, { color: colors.mutedForeground }]}>
              {prompt}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            contentContainerStyle={styles.listContent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeaderComponent}
          />
        )}

        <ChatInput onSend={handleSend} disabled={isTyping} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
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
  onlineText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  headerBtn: {
    padding: 4,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
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
  emptyTitle: {
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
