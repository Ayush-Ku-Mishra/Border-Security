import { useState, useEffect } from "react";

const SENSOR_NAMES = {
  NODE_1: "Kargil Post Alpha",
  NODE_2: "Drass Checkpoint",
  NODE_3: "Batalik Ridge",
  NODE_4: "Mushkoh Valley",
  NODE_5: "Suru River Post",
};

const THREAT_CONFIG = {
  0: { bg: "#052e16", border: "#16a34a", text: "#4ade80", label: "NO THREAT" },
  1: { bg: "#0c1a40", border: "#2563eb", text: "#60a5fa", label: "LOW" },
  2: { bg: "#422006", border: "#d97706", text: "#fbbf24", label: "MEDIUM" },
  3: { bg: "#431407", border: "#ea580c", text: "#fb923c", label: "HIGH" },
  4: { bg: "#450a0a", border: "#dc2626", text: "#f87171", label: "CRITICAL" },
};

const ACTIVITY_ICONS = {
  Walking: "🚶",
  Running: "🏃",
  Breathing: "😮‍💨",
  Unknown: "❓",
};

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse` +
        `?lat=${lat}&lng=${lng}&format=json`,
    );
    const data = await res.json();
    const a = data.address;
    return (
      a.village ||
      a.town ||
      a.suburb ||
      a.county ||
      a.state_district ||
      a.state ||
      "Border Zone"
    );
  } catch {
    return "Border Zone";
  }
};

const AlertCard = ({ detection, onAcknowledge }) => {
  const [placeName, setPlaceName] = useState("Locating...");

  const threat = detection.threatLevel || 0;
  const cfg = THREAT_CONFIG[threat] || THREAT_CONFIG[0];
  const activity = detection.activity?.trim() || "Unknown";
  const icon = ACTIVITY_ICONS[activity] || "❓";
  const sensor =
    SENSOR_NAMES[detection.sensorId] || detection.sensorId || "Unknown";
  const time = new Date(
    detection.createdAt || detection.timestamp,
  ).toLocaleTimeString();

  useEffect(() => {
    if (detection.location?.lat && detection.location?.lng) {
      reverseGeocode(detection.location.lat, detection.location.lng).then(
        setPlaceName,
      );
    }
  }, [detection.location]);

  return (
    <div
      style={{
        background: cfg.bg,
        borderLeft: `3px solid ${cfg.border}`,
        borderRadius: "8px",
        padding: "8px 10px",
        marginBottom: "6px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            color: cfg.text,
            fontWeight: "bold",
            fontSize: "12px",
          }}
        >
          {icon} {activity}
        </span>
        <span
          style={{
            color: cfg.text,
            border: `1px solid ${cfg.border}`,
            fontSize: "10px",
            padding: "1px 6px",
            borderRadius: "999px",
            fontWeight: "bold",
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Info */}
      <div
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          lineHeight: "1.6",
        }}
      >
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          📍 {placeName}
        </div>
        <div>📡 {sensor}</div>
        <div>
          🎯 {detection.confidence?.toFixed(1)}% &nbsp;|&nbsp; 🕐 {time}
        </div>
      </div>

      {/* Button */}
      {detection.status === "new" ? (
        <button
          onClick={() => onAcknowledge(detection._id)}
          style={{
            marginTop: "6px",
            width: "100%",
            background: "#1f2937",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "4px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          ✓ Acknowledge
        </button>
      ) : (
        <div
          style={{
            marginTop: "4px",
            textAlign: "center",
            fontSize: "10px",
            color: "#6b7280",
          }}
        >
          ✓ Acknowledged
        </div>
      )}
    </div>
  );
};

export default AlertCard;
