import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import BorderMap from "../components/Map/BorderMap";
import AlertFeed from "../components/Alerts/AlertFeed";
import SensorStatus from "../components/Sensors/SensorStatus";
import ThreatChart from "../components/Analytics/ThreatChart";
import { useSocket } from "../hooks/useSocket";
import { startAlarm, stopAlarm, playBeep } from "../services/soundService";
import {
  getDetections,
  getLiveDetection,
  simulateDetections,
  getSensors,
  acknowledgeDetection,
  clearDetections,
} from "../services/api";

const Dashboard = () => {
  const [detections, setDetections] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [lastDetection, setLastDetection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [alarmOn, setAlarmOn] = useState(false);

  const { isConnected, lastDetection: socketDetection } = useSocket();

  useEffect(() => {
    const hasHighThreat = detections.some(
      (d) => d.threatLevel >= 3 && d.status !== "acknowledged",
    );
    if (hasHighThreat && !alarmOn) {
      startAlarm();
      setAlarmOn(true);
    } else if (!hasHighThreat && alarmOn) {
      stopAlarm();
      setAlarmOn(false);
    }
  }, [detections, alarmOn]);

  const loadData = useCallback(async () => {
    try {
      const [detRes, senRes] = await Promise.all([
        getDetections(),
        getSensors(),
      ]);
      setDetections(detRes.detections || []);
      setSensors(senRes.sensors || []);
    } catch {
      toast.error("Failed to load data");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!socketDetection) return;
    setDetections((prev) => {
      const exists = prev.find(
        (d) => d.detectionId === socketDetection.detectionId,
      );
      if (exists) return prev;
      return [socketDetection, ...prev];
    });
    setLastDetection(socketDetection);
    const threat = socketDetection.threatLevel;
    if (threat >= 3) {
      toast.error(`🚨 HIGH THREAT: ${socketDetection.activity}!`, {
        duration: 6000,
      });
    } else if (threat >= 2) {
      playBeep(2);
      toast(`⚠️ ${socketDetection.activity} detected`, {
        icon: "⚠️",
        duration: 3000,
      });
    } else {
      playBeep(1);
      toast.success(`ℹ️ ${socketDetection.activity} detected`, {
        duration: 2000,
      });
    }
  }, [socketDetection]);

  const handleLiveDetect = async () => {
    setIsLoading(true);
    try {
      const res = await getLiveDetection();
      if (res.success) {
        toast.success("Detection processed");
        setLastDetection(res.detection);
        await loadData();
      }
    } catch {
      toast.error("Detection failed");
    }
    setIsLoading(false);
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await simulateDetections();
      if (res.success) {
        toast.success(`${res.count} scenarios simulated`);
        setLastDetection(res.detections[0]);
        await loadData();
      }
    } catch {
      toast.error("Simulation failed");
    }
    setIsLoading(false);
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeDetection(id, "Operator");
      setDetections((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: "acknowledged" } : d)),
      );
      toast.success("Alert acknowledged");
    } catch {
      toast.error("Failed to acknowledge");
    }
  };

  const handleClear = async () => {
    try {
      await clearDetections();
      setDetections([]);
      setLastDetection(null);
      stopAlarm();
      setAlarmOn(false);
      toast.success("Cleared");
    } catch {
      toast.error("Failed to clear");
    }
  };

  useEffect(() => {
    if (!autoMode) return;
    const interval = setInterval(handleLiveDetect, 5000);
    return () => clearInterval(interval);
  }, [autoMode]);

  const highThreats = detections.filter((d) => d.threatLevel >= 3).length;
  const motionCount = detections.filter((d) => d.isMotion).length;

  const btnStyle = (bg) => ({
    background: bg,
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#030712",
        display: "flex",
        flexDirection: "column",
        minWidth: "320px",
      }}
    >
      <Toaster position="top-right" />

      {/* ════ TOP BAR ════ */}
      <div
        style={{
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "12px",
          minHeight: "56px",
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "22px" }}>🛡️</span>
          <div>
            <div
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: "13px",
                lineHeight: "1.3",
              }}
            >
              BORDER SECURITY COMMAND CENTER
            </div>
            <div
              style={{
                color: "#64748b",
                fontSize: "10px",
              }}
            >
              WiFi Movement Detection System
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexShrink: 0,
          }}
        >
          {[
            { v: detections.length, l: "Total", c: "#f1f5f9" },
            { v: motionCount, l: "Motion", c: "#facc15" },
            { v: highThreats, l: "Threats", c: "#f87171" },
          ].map(({ v, l, c }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div
                style={{
                  color: c,
                  fontSize: "20px",
                  fontWeight: "bold",
                  lineHeight: "1",
                }}
              >
                {v}
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "10px",
                  marginTop: "2px",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            flexWrap: "nowrap",
          }}
        >
          {alarmOn && (
            <div
              style={{
                ...btnStyle("#7f1d1d"),
                animation: "pulse 1s infinite",
              }}
            >
              🔔 ALARM
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: isConnected ? "#052e16" : "#450a0a",
              color: isConnected ? "#4ade80" : "#f87171",
              fontSize: "11px",
              padding: "5px 10px",
              borderRadius: "999px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isConnected ? "#4ade80" : "#f87171",
              }}
            />
            {isConnected ? "LIVE" : "OFFLINE"}
          </div>

          <button
            onClick={() => setAutoMode((p) => !p)}
            style={btnStyle(autoMode ? "#15803d" : "#374151")}
          >
            {autoMode ? "⏹ STOP" : "▶ AUTO"}
          </button>

          <button
            onClick={handleLiveDetect}
            disabled={isLoading}
            style={{
              ...btnStyle("#1d4ed8"),
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "..." : "⚡ DETECT"}
          </button>

          <button
            onClick={handleSimulate}
            disabled={isLoading}
            style={{
              ...btnStyle("#6d28d9"),
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            🎭 SIMULATE
          </button>

          <button onClick={handleClear} style={btnStyle("#991b1b")}>
            🗑 CLEAR
          </button>
        </div>
      </div>

      {/* ════ BODY ════ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* ── MAP ── */}
        <div
          style={{
            flex: 1,
            padding: "8px",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #1e293b",
              overflow: "hidden",
            }}
          >
            <BorderMap
              detections={detections}
              sensors={sensors}
              lastDetection={lastDetection}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          style={{
            width: "290px",
            minWidth: "290px",
            maxWidth: "290px",
            padding: "8px 8px 8px 0",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* ALERTS - flex grow */}
          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #1e293b",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              flex: "1 1 0",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <AlertFeed
              detections={detections}
              onAcknowledge={handleAcknowledge}
            />
          </div>

          {/* SENSORS - fixed */}
          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #1e293b",
              padding: "10px 12px",
              flexShrink: 0,
            }}
          >
            <SensorStatus sensors={sensors} />
          </div>

          {/* CHART - fixed height */}
          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #1e293b",
              padding: "10px 12px",
              flexShrink: 0,
              height: "190px",
            }}
          >
            <ThreatChart detections={detections} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
