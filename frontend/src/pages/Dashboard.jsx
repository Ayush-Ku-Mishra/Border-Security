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

// ─────────────────────────────────────────
// DETECT MOBILE
// ─────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
};

const Dashboard = () => {
  const [detections, setDetections] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [lastDetection, setLastDetection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [alarmOn, setAlarmOn] = useState(false);
  const [mobileTab, setMobileTab] = useState("map");

  const isMobile = useIsMobile();

  const {
    isConnected,
    lastDetection: socketDetection,
    clearSignal,
  } = useSocket();

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

  useEffect(() => {
    if (clearSignal === 0) return;
    setDetections([]);
    setLastDetection(null);
    stopAlarm();
    setAlarmOn(false);
    toast.success("Cleared by operator");
  }, [clearSignal]);

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

  const btnStyle = (bg, disabled = false) => ({
    background: disabled ? "#374151" : bg,
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    opacity: disabled ? 0.6 : 1,
  });

  // ─────────────────────────────────────────
  // DESKTOP LAYOUT - EXACTLY AS BEFORE
  // ─────────────────────────────────────────
  if (!isMobile) {
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

        {/* TOP BAR */}
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
              <div style={{ color: "#64748b", fontSize: "10px" }}>
                WiFi Movement Detection System
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
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
              style={btnStyle("#1d4ed8", isLoading)}
            >
              {isLoading ? "..." : "⚡ DETECT"}
            </button>
            <button
              onClick={handleSimulate}
              disabled={isLoading}
              style={btnStyle("#6d28d9", isLoading)}
            >
              🎭 SIMULATE
            </button>
            <button onClick={handleClear} style={btnStyle("#991b1b")}>
              🗑 CLEAR
            </button>
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* MAP */}
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

          {/* RIGHT PANEL */}
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
  }

  // ─────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#030712",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Toaster position="top-center" />

      {/* MOBILE: APP NAME ROW */}
      <div
        style={{
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "22px" }}>🛡️</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: "15px",
              letterSpacing: "0.5px",
            }}
          >
            BORDER SECURITY
          </div>
          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            WiFi Movement Detection System
          </div>
        </div>
        {/* Live indicator right side */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: isConnected ? "#052e16" : "#450a0a",
            color: isConnected ? "#4ade80" : "#f87171",
            fontSize: "10px",
            padding: "4px 8px",
            borderRadius: "999px",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: isConnected ? "#4ade80" : "#f87171",
            }}
          />
          {isConnected ? "LIVE" : "OFF"}
        </div>
      </div>

      {/* MOBILE: COUNTS ROW */}
      <div
        style={{
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0",
          flexShrink: 0,
        }}
      >
        {[
          { v: detections.length, l: "Total", c: "white" },
          { v: motionCount, l: "Motion", c: "#facc15" },
          { v: highThreats, l: "Threats", c: "#f87171" },
        ].map(({ v, l, c }) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div
              style={{
                color: c,
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {v}
            </div>
            <div
              style={{
                color: "#64748b",
                fontSize: "9px",
              }}
            >
              {l}
            </div>
          </div>
        ))}
        {alarmOn && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#7f1d1d",
              color: "#f87171",
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              alignSelf: "center",
            }}
          >
            🔔 ALARM
          </div>
        )}
      </div>

      {/* MOBILE: BUTTONS ROW - horizontally scrollable */}
      <div
        style={{
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          .mobile-btn-row::-webkit-scrollbar { display: none; }
        `}</style>
        <div
          className="mobile-btn-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            minWidth: "max-content",
          }}
        >
          <button
            onClick={() => setAutoMode((p) => !p)}
            style={{
              background: autoMode ? "#15803d" : "#374151",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {autoMode ? "⏹ STOP AUTO" : "▶ AUTO"}
          </button>

          <button
            onClick={handleLiveDetect}
            disabled={isLoading}
            style={{
              background: isLoading ? "#374151" : "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "..." : "⚡ DETECT"}
          </button>

          <button
            onClick={handleSimulate}
            disabled={isLoading}
            style={{
              background: isLoading ? "#374151" : "#6d28d9",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            🎭 SIMULATE
          </button>

          <button
            onClick={handleClear}
            style={{
              background: "#991b1b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🗑 CLEAR
          </button>
        </div>
      </div>

      {/* MOBILE: TAB CONTENT */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
          position: "relative",
        }}
      >
        {/* MAP TAB */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: mobileTab === "map" ? "flex" : "none",
            padding: "8px",
          }}
        >
          <div
            style={{
              flex: 1,
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

        {/* ALERTS TAB */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: mobileTab === "alerts" ? "flex" : "none",
            flexDirection: "column",
            padding: "8px",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #1e293b",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <AlertFeed
              detections={detections}
              onAcknowledge={handleAcknowledge}
            />
          </div>
        </div>

        {/* NODES TAB */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: mobileTab === "nodes" ? "block" : "none",
            padding: "8px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #1e293b",
              padding: "12px",
            }}
          >
            <SensorStatus sensors={sensors} />
          </div>
        </div>

        {/* ACTIVITY TAB */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: mobileTab === "activity" ? "flex" : "none",
            padding: "8px",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #1e293b",
              padding: "12px",
            }}
          >
            <ThreatChart detections={detections} />
          </div>
        </div>
      </div>

      {/* MOBILE: BOTTOM NAV */}
      <nav
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "#0f172a",
          borderTop: "2px solid #1e293b",
          flexShrink: 0,
          minHeight: "65px",
          width: "100%",
          position: "relative",
          zIndex: 9999,
        }}
      >
        {[
          { key: "map", icon: "🗺️", label: "Map" },
          { key: "alerts", icon: "🚨", label: "Alerts" },
          { key: "nodes", icon: "📡", label: "Nodes" },
          { key: "activity", icon: "📊", label: "Activity" },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            style={{
              background: mobileTab === key ? "#1e293b" : "transparent",
              color: mobileTab === key ? "white" : "#64748b",
              border: "none",
              borderTop:
                mobileTab === key
                  ? "3px solid #3b82f6"
                  : "3px solid transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              padding: "8px 4px",
              width: "100%",
              height: "100%",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                lineHeight: "1",
              }}
            >
              {icon}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "600",
                lineHeight: "1",
              }}
            >
              {label}
            </span>
            {key === "alerts" && detections.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  background: "#dc2626",
                  color: "white",
                  fontSize: "8px",
                  padding: "1px 5px",
                  borderRadius: "999px",
                  fontWeight: "bold",
                }}
              >
                {detections.length}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;
