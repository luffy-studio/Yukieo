import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ModelStatus =
  | "not_installed"
  | "downloading"
  | "paused"
  | "verifying"
  | "installing"
  | "optimizing"
  | "ready";

export type ModelInfo = {
  name: string;
  displayName: string;
  size: number;
  version: string;
};

const MODEL_INFO: ModelInfo = {
  name: "Qwen2.5-1.5B-Instruct",
  displayName: "Qwen 2.5 · 1.5B",
  size: 987000000,
  version: "1.0.0",
};

const TOTAL_BYTES = MODEL_INFO.size;
const STORAGE_KEY_STATUS = "model_status_v2";

type ModelContextType = {
  initialized: boolean;
  status: ModelStatus;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  downloadSpeed: number;
  eta: number;
  modelInfo: ModelInfo;
  storageUsed: number;
  startDownload: () => void;
  pauseDownload: () => void;
  resumeDownload: () => void;
  retryDownload: () => void;
  deleteModel: () => Promise<void>;
  clearCache: () => Promise<void>;
};

const ModelContext = createContext<ModelContextType | null>(null);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [status, setStatus] = useState<ModelStatus>("not_installed");
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  const downloadedRef = useRef(0);
  const isRunningRef = useRef(false);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_STATUS).then((saved) => {
      if (saved === "ready") {
        downloadedRef.current = TOTAL_BYTES;
        setStatus("ready");
        setProgress(100);
        setDownloadedBytes(TOTAL_BYTES);
      }
      setInitialized(true);
    });
    return () => stopInterval();
  }, [stopInterval]);

  const eta =
    downloadSpeed > 0 ? (TOTAL_BYTES - downloadedBytes) / downloadSpeed : 0;

  const commitProgress = useCallback(() => {
    const downloaded = downloadedRef.current;
    const pct = (downloaded / TOTAL_BYTES) * 100;
    setDownloadedBytes(downloaded);
    setProgress(pct);
  }, []);

  const runSimulation = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    isPausedRef.current = false;
    setStatus("downloading");

    let lastUIUpdate = Date.now();

    intervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;

      const chunkSize = 800_000 + Math.random() * 1_200_000;
      downloadedRef.current = Math.min(
        downloadedRef.current + chunkSize,
        TOTAL_BYTES
      );

      const now = Date.now();
      if (now - lastUIUpdate >= 100) {
        lastUIUpdate = now;
        const speed = chunkSize * (1000 / 100);
        setDownloadSpeed(speed);
        commitProgress();
      }

      if (downloadedRef.current >= TOTAL_BYTES) {
        stopInterval();
        commitProgress();

        setStatus("verifying");
        setTimeout(() => {
          setStatus("installing");
          setTimeout(() => {
            setStatus("optimizing");
            setTimeout(() => {
              setStatus("ready");
              setProgress(100);
              setDownloadedBytes(TOTAL_BYTES);
              AsyncStorage.setItem(STORAGE_KEY_STATUS, "ready");
            }, 1200);
          }, 1000);
        }, 800);
      }
    }, 100);
  }, [commitProgress, stopInterval]);

  const startDownload = useCallback(() => {
    stopInterval();
    downloadedRef.current = 0;
    setDownloadedBytes(0);
    setProgress(0);
    setDownloadSpeed(0);
    runSimulation();
  }, [stopInterval, runSimulation]);

  const pauseDownload = useCallback(() => {
    isPausedRef.current = true;
    setStatus("paused");
    setDownloadSpeed(0);
  }, []);

  const resumeDownload = useCallback(() => {
    if (isRunningRef.current) {
      isPausedRef.current = false;
      setStatus("downloading");
      return;
    }
    runSimulation();
  }, [runSimulation]);

  const retryDownload = useCallback(() => {
    stopInterval();
    downloadedRef.current = 0;
    setDownloadedBytes(0);
    setProgress(0);
    setDownloadSpeed(0);
    runSimulation();
  }, [stopInterval, runSimulation]);

  const deleteModel = useCallback(async () => {
    stopInterval();
    downloadedRef.current = 0;
    await AsyncStorage.removeItem(STORAGE_KEY_STATUS);
    setStatus("not_installed");
    setProgress(0);
    setDownloadedBytes(0);
    setDownloadSpeed(0);
  }, [stopInterval]);

  const clearCache = useCallback(async () => {
    await AsyncStorage.multiRemove(["chat_history"]);
  }, []);

  return (
    <ModelContext.Provider
      value={{
        initialized,
        status,
        progress,
        downloadedBytes,
        totalBytes: TOTAL_BYTES,
        downloadSpeed,
        eta,
        modelInfo: MODEL_INFO,
        storageUsed: status === "ready" ? TOTAL_BYTES : downloadedRef.current,
        startDownload,
        pauseDownload,
        resumeDownload,
        retryDownload,
        deleteModel,
        clearCache,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
