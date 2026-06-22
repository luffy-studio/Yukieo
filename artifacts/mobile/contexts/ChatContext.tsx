import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
};

type ChatContextType = {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  deleteMessage: (id: string) => void;
  regenerateResponse: () => Promise<void>;
  clearHistory: () => Promise<void>;
  exportChats: () => string;
};

const ChatContext = createContext<ChatContextType | null>(null);

const STORAGE_KEY = "chat_history";

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const PERSONALITY_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hey 👋",
    "Hey! Good to see you.",
    "Hi there 😊",
    "Hey, what's up?",
    "Hello! How's it going?",
  ],
  howAreYou: [
    "Pretty good actually. Been thinking a lot today — your turn, how are you?",
    "Honestly? Great. What about you?",
    "Doing well! Got a lot on my mind. How about you?",
    "Good, thanks for asking 😊 What's on your mind?",
  ],
  whatAreYouDoing: [
    "Just hanging out here 😄",
    "Thinking, mostly. What are you up to?",
    "Just here for you. What's going on?",
    "Not much — just waiting to chat. What's up?",
  ],
  feelings: [
    "That makes sense. Want to talk about it?",
    "I hear you. What's going on?",
    "That's tough. I'm here if you want to vent.",
    "Yeah, that sounds really hard. How are you holding up?",
    "It's okay to feel that way. What happened?",
  ],
  thanks: [
    "Of course 😊",
    "Anytime!",
    "Happy to help.",
    "Always here.",
    "That's what I'm here for.",
  ],
  bored: [
    "Want to play 20 questions? Or we could just talk — I'm not picky.",
    "Tell me something you've been meaning to say but haven't.",
    "Let's fix that. What's something you've been curious about lately?",
    "Same, honestly. Want to talk about something random?",
  ],
  default: [
    "Interesting. Tell me more?",
    "I hadn't thought about it that way.",
    "That's a good point.",
    "Hmm. What do you think about it?",
    "Yeah, I get that.",
    "Makes sense to me.",
    "I think about that sometimes too.",
    "Fair enough.",
    "Go on, I'm listening.",
    "That's actually really interesting.",
  ],
};

function detectIntent(text: string): string {
  const lower = text.toLowerCase().trim();
  if (/^(hi|hey|hello|hiya|sup|what's up|yo)\b/.test(lower)) return "greeting";
  if (/how are you|how's it going|how do you feel|you okay/.test(lower)) return "howAreYou";
  if (/what are you doing|what('re| are) you up to/.test(lower)) return "whatAreYouDoing";
  if (/\b(sad|depressed|anxious|stressed|lonely|upset|angry|frustrated|scared|worried)\b/.test(lower)) return "feelings";
  if (/\b(thanks|thank you|thx|ty)\b/.test(lower)) return "thanks";
  if (/\b(bored|boring|nothing to do)\b/.test(lower)) return "bored";
  return "default";
}

function buildContextualResponse(
  userText: string,
  history: Message[]
): string {
  const intent = detectIntent(userText);
  const pool = PERSONALITY_RESPONSES[intent] ?? PERSONALITY_RESPONSES.default;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  if (intent === "default" && userText.trim().endsWith("?")) {
    const extras = [
      "That's a great question — I'm not totally sure, honestly.",
      "Hmm, I'd have to think about that more. What's your take?",
      "Good question. What made you think of that?",
      "I've wondered that myself. What do you think?",
    ];
    return extras[Math.floor(Math.random() * extras.length)];
  }

  return pick;
}

async function simulateStream(
  fullResponse: string,
  onChunk: (chunk: string) => void,
  onDone: () => void
) {
  const words = fullResponse.split(" ");
  const baseDelay = 40 + Math.random() * 30;
  let built = "";

  for (let i = 0; i < words.length; i++) {
    await new Promise((r) => setTimeout(r, baseDelay + Math.random() * 20));
    built += (i === 0 ? "" : " ") + words[i];
    onChunk(built);
  }
  onDone();
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const lastUserMessageRef = useRef<string>("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Message[];
          setMessages(parsed);
        } catch {}
      }
    });
  }, []);

  const saveMessages = useCallback((msgs: Message[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  }, []);

  const sendAIResponse = useCallback(
    async (userText: string, currentMessages: Message[]) => {
      const thinkDelay = 600 + Math.random() * 800;
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, thinkDelay));
      setIsTyping(false);

      const response = buildContextualResponse(userText, currentMessages);
      const assistantId = makeId();

      const streamingMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => {
        const updated = [...prev, streamingMsg];
        return updated;
      });

      await simulateStream(
        response,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: chunk } : m
            )
          );
        },
        () => {
          setMessages((prev) => {
            const done = prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            );
            saveMessages(done);
            return done;
          });
        }
      );
    },
    [saveMessages]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      lastUserMessageRef.current = trimmed;

      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

      await sendAIResponse(trimmed, updatedMessages);
    },
    [messages, saveMessages, sendAIResponse]
  );

  const deleteMessage = useCallback(
    (id: string) => {
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== id);
        saveMessages(updated);
        return updated;
      });
    },
    [saveMessages]
  );

  const regenerateResponse = useCallback(async () => {
    setMessages((prev) => {
      const withoutLast =
        prev[prev.length - 1]?.role === "assistant"
          ? prev.slice(0, -1)
          : prev;
      saveMessages(withoutLast);
      return withoutLast;
    });
    await new Promise((r) => setTimeout(r, 100));
    if (lastUserMessageRef.current) {
      await sendAIResponse(lastUserMessageRef.current, messages.slice(0, -1));
    }
  }, [messages, saveMessages, sendAIResponse]);

  const clearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }, []);

  const exportChats = useCallback(() => {
    return messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleString()}] ${
            m.role === "user" ? "You" : "AI"
          }: ${m.content}`
      )
      .join("\n");
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isTyping,
        sendMessage,
        deleteMessage,
        regenerateResponse,
        clearHistory,
        exportChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
