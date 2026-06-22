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

type ModelContextType = {
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
  const [status, setStatus] = useState<ModelStatus>("not_installed");
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

  const totalBytes = MODEL_INFO.size;

  useEffect(() => {
    AsyncStorage.getItem("model_status").then((s) => {
      if (s === "ready") {
        setStatus("ready");
        setProgress(100);
        setDownloadedBytes(totalBytes);
      }
    });
  }, []);

  const eta = downloadSpeed > 0 ? (totalBytes - downloadedBytes) / downloadSpeed : 0;

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const runDownloadSimulation = useCallback(() => {
    isPausedRef.current = false;
    setStatus("downloading");

    let downloaded = downloadedBytes;

    intervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;

      const chunkSize = 800000 + Math.random() * 1200000;
      downloaded = Math.min(downloaded + chunkSize, totalBytes);
      const pct = (downloaded / totalBytes) * 100;
      const speed = chunkSize * (1000 / 150);

      setDownloadedBytes(downloaded);
      setProgress(pct);
      setDownloadSpeed(speed);

      if (downloaded >= totalBytes) {
        clearInterval_();
        setStatus("verifying");
        setTimeout(() => {
          setStatus("installing");
          setTimeout(() => {
            setStatus("optimizing");
            setTimeout(() => {
              setStatus("ready");
              setProgress(100);
              AsyncStorage.setItem("model_status", "ready");
            }, 1200);
          }, 1000);
        }, 800);
      }
    }, 150);
  }, [downloadedBytes, totalBytes, clearInterval_]);

  const startDownload = useCallback(() => {
    setDownloadedBytes(0);
    setProgress(0);
    runDownloadSimulation();
  }, [runDownloadSimulation]);

  const pauseDownload = useCallback(() => {
    isPausedRef.current = true;
    setStatus("paused");
    setDownloadSpeed(0);
  }, []);

  const resumeDownload = useCallback(() => {
    runDownloadSimulation();
  }, [runDownloadSimulation]);

  const retryDownload = useCallback(() => {
    clearInterval_();
    setDownloadedBytes(0);
    setProgress(0);
    runDownloadSimulation();
  }, [clearInterval_, runDownloadSimulation]);

  const deleteModel = useCallback(async () => {
    clearInterval_();
    await AsyncStorage.removeItem("model_status");
    setStatus("not_installed");
    setProgress(0);
    setDownloadedBytes(0);
    setDownloadSpeed(0);
  }, [clearInterval_]);

  const clearCache = useCallback(async () => {
    await AsyncStorage.removeItem("chat_history");
  }, []);

  useEffect(() => () => clearInterval_(), [clearInterval_]);

  return (
    <ModelContext.Provider
      value={{
        status,
        progress,
        downloadedBytes,
        totalBytes,
        downloadSpeed,
        eta,
        modelInfo: MODEL_INFO,
        storageUsed: status === "ready" ? totalBytes : downloadedBytes,
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
