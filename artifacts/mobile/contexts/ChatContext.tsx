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
  isSending: boolean;
  sendMessage: (text: string) => void;
  deleteMessage: (id: string) => void;
  regenerateResponse: () => void;
  clearHistory: () => Promise<void>;
  exportChats: () => string;
};

const ChatContext = createContext<ChatContextType | null>(null);

const STORAGE_KEY = "chat_history";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const PERSONALITY: Record<string, string[]> = {
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
  question: [
    "That's a great question — I'm not totally sure, honestly.",
    "Hmm, I'd have to think about that more. What's your take?",
    "Good question. What made you think of that?",
    "I've wondered that myself. What do you think?",
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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildResponse(text: string): string {
  const lower = text.toLowerCase().trim();
  if (/^(hi|hey|hello|hiya|sup|yo)\b/.test(lower)) return pick(PERSONALITY.greeting);
  if (/how are you|how'?s? it going|you okay/.test(lower)) return pick(PERSONALITY.howAreYou);
  if (/what are you doing|what'?r?e? you up to/.test(lower)) return pick(PERSONALITY.whatAreYouDoing);
  if (/\b(sad|depressed|anxious|stressed|lonely|upset|angry|frustrated|scared|worried)\b/.test(lower)) return pick(PERSONALITY.feelings);
  if (/\b(thanks|thank you|thx|ty)\b/.test(lower)) return pick(PERSONALITY.thanks);
  if (/\b(bored|boring|nothing to do)\b/.test(lower)) return pick(PERSONALITY.bored);
  if (lower.trim().endsWith("?")) return pick(PERSONALITY.question);
  return pick(PERSONALITY.default);
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesRef = useRef<Message[]>([]);
  const abortRef = useRef<(() => void) | null>(null);
  const lastUserTextRef = useRef("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Message[];
        messagesRef.current = parsed;
        setMessages(parsed);
      } catch {}
    });
  }, []);

  const persist = useCallback((msgs: Message[]) => {
    const clean = msgs.map((m) =>
      m.isStreaming ? { ...m, isStreaming: false } : m
    );
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }, []);

  const applyMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        return next;
      });
    },
    []
  );

  const streamResponse = useCallback(
    async (responseText: string, assistantId: string): Promise<void> => {
      const words = responseText.split(" ");
      let aborted = false;
      abortRef.current = () => {
        aborted = true;
      };

      const delay = () =>
        new Promise<void>((r) => setTimeout(r, 40 + Math.random() * 25));

      let built = "";
      for (let i = 0; i < words.length; i++) {
        if (aborted) return;
        await delay();
        if (aborted) return;
        built += (i === 0 ? "" : " ") + words[i];
        const snapshot = built;
        applyMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: snapshot } : m
          )
        );
      }

      abortRef.current = null;
      applyMessages((prev) => {
        const done = prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        );
        persist(done);
        return done;
      });
    },
    [applyMessages, persist]
  );

  const runAITurn = useCallback(
    async (userText: string) => {
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }

      const thinkMs = 600 + Math.random() * 700;
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, thinkMs));
      setIsTyping(false);

      const response = buildResponse(userText);
      const assistantId = makeId();

      applyMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]);

      await streamResponse(response, assistantId);
      setIsSending(false);
    },
    [applyMessages, streamResponse]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      lastUserTextRef.current = trimmed;
      setIsSending(true);

      applyMessages((prev) => {
        const updated = [
          ...prev,
          {
            id: makeId(),
            role: "user" as const,
            content: trimmed,
            timestamp: Date.now(),
          },
        ];
        persist(updated);
        return updated;
      });

      runAITurn(trimmed);
    },
    [isSending, applyMessages, persist, runAITurn]
  );

  const deleteMessage = useCallback(
    (id: string) => {
      applyMessages((prev) => {
        const updated = prev.filter((m) => m.id !== id);
        persist(updated);
        return updated;
      });
    },
    [applyMessages, persist]
  );

  const regenerateResponse = useCallback(() => {
    if (isSending) return;

    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    const current = messagesRef.current;
    const withoutLast =
      current[current.length - 1]?.role === "assistant"
        ? current.slice(0, -1)
        : current;

    setIsSending(true);
    setIsTyping(false);
    applyMessages(() => {
      persist(withoutLast);
      return withoutLast;
    });

    const lastUserMsg = lastUserTextRef.current;
    if (lastUserMsg) {
      runAITurn(lastUserMsg);
    } else {
      setIsSending(false);
    }
  }, [isSending, applyMessages, persist, runAITurn]);

  const clearHistory = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setIsTyping(false);
    setIsSending(false);
    messagesRef.current = [];
    setMessages([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportChats = useCallback((): string => {
    return messagesRef.current
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleString()}] ${
            m.role === "user" ? "You" : "Aria"
          }: ${m.content}`
      )
      .join("\n");
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isTyping,
        isSending,
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
