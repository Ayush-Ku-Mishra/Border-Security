import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [lastAlert, setLastAlert] = useState(null);

  useEffect(() => {
    // Connect to Node.js server
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    // Listen for new detections
    socketRef.current.on("new_detection", (data) => {
      setLastDetection(data);
    });

    // Listen for new alerts
    socketRef.current.on("new_alert", (data) => {
      console.log("⚠️ New alert:", data);
      setLastAlert(data);
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
    lastAlert,
    acknowledgeAlert,
    markFalseAlarm,
  };
};
