import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [clearSignal, setClearSignal] = useState(0);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    // New detection from any device
    socketRef.current.on("new_detection", (data) => {
      setLastDetection(data);
    });

    // Clear from any device
    socketRef.current.on("clear_all", () => {
      console.log("🗑 Clear signal received");
      setClearSignal((prev) => prev + 1);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const acknowledgeAlert = (detectionId) => {
    socketRef.current?.emit("acknowledge_alert", { detectionId });
  };

  const markFalseAlarm = (detectionId) => {
    socketRef.current?.emit("mark_false_alarm", { detectionId });
  };

  return {
    isConnected,
    lastDetection,
    clearSignal,
    acknowledgeAlert,
    markFalseAlarm,
  };
};
