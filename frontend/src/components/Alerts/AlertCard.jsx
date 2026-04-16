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
  1: { bg: "#0c1a40", border: "#2563eb", text: "#60a5fa", label: "LOW"       },
  2: { bg: "#422006", border: "#d97706", text: "#fbbf24", label: "MEDIUM"    },
  3: { bg: "#431407", border: "#ea580c", text: "#fb923c", label: "HIGH"      },
  4: { bg: "#450a0a", border: "#dc2626", text: "#f87171", label: "CRITICAL"  },
};

const ACTIVITY_ICONS = {
  Walking      : "🚶",
  Running      : "🏃",
  Hiding       : "😮‍💨",
  Crawling     : "🪖",
  Motorcycle   : "🏍️",
  Vehicle      : "🚗",
  Truck        : "🚛",
  "Large Animal": "🐄",
  "Small Animal": "🐕",
  Unknown      : "❓",
};

// ─────────────────────────────────────────
// ZONE KEY → HUMAN READABLE LABEL
// ─────────────────────────────────────────
const ZONE_LABELS = {
  inside_circle : "Near Sensor Node",
  on_border_line: "On Border Line",
  between_nodes : "Between Sensor Nodes",
  approaching   : "Approaching Border",
  unknown       : "Unknown Area",
};

const reverseGeocode = async (lat, lng) => {
  try {
    const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const res  = await fetch(
      `${BASE}/detections/geocode?lat=${lat}&lng=${lng}`
    );
    const data = await res.json();
    return data.place || "Border Zone";
  } catch {
    return "Border Zone";
  }
};

const AlertCard = ({ detection, onAcknowledge }) => {
  const [placeName,  setPlaceName]  = useState("Locating...");
  const [ackLoading, setAckLoading] = useState(false);

  const threat   = detection.threatLevel ?? 0;
  const cfg      = THREAT_CONFIG[threat] || THREAT_CONFIG[0];
  const activity = detection.activity?.trim() || "Unknown";
  const icon     = ACTIVITY_ICONS[activity]   || "❓";
  const sensor   = SENSOR_NAMES[detection.sensorId] || detection.sensorId || "Unknown";
  const time     = new Date(
    detection.createdAt || detection.timestamp
  ).toLocaleTimeString();

  // ── Zone label: use zoneLabel from DB first, fallback to map ──
  const zoneDisplay =
    detection.zoneLabel ||
    ZONE_LABELS[detection.zone] ||
    "Unknown Area";

  useEffect(() => {
    if (detection.location?.lat && detection.location?.lng) {
      reverseGeocode(
        detection.location.lat,
        detection.location.lng
      ).then(setPlaceName);
    }
  }, [detection.location]);

  const handleAcknowledge = async () => {
    setAckLoading(true);
    await onAcknowledge(detection._id);
    setAckLoading(false);
  };

  return (
    <div style={{
      background  : cfg.bg,
      borderLeft  : `3px solid ${cfg.border}`,
      borderRadius: "8px",
      padding     : "8px 10px",
      marginBottom: "6px",
    }}>

      {/* ── Row 1: Activity name + Threat badge ── */}
      <div style={{
        display       : "flex",
        justifyContent: "space-between",
        alignItems    : "center",
        marginBottom  : "4px",
      }}>
        <span style={{
          color     : cfg.text,
          fontWeight: "bold",
          fontSize  : "13px",
        }}>
          {icon} {activity}
        </span>
        <span style={{
          color       : cfg.text,
          border      : `1px solid ${cfg.border}`,
          fontSize    : "10px",
          padding     : "1px 6px",
          borderRadius: "999px",
          fontWeight  : "bold",
          flexShrink  : 0,
          marginLeft  : "6px",
        }}>
          {cfg.label}
        </span>
      </div>

      {/* ── Row 2: Info ── */}
      <div style={{
        fontSize  : "11px",
        color     : "#9ca3af",
        lineHeight: "1.7",
      }}>
        {/* Real place name from geocoding */}
        <div style={{
          overflow    : "hidden",
          textOverflow: "ellipsis",
          whiteSpace  : "nowrap",
        }}>
          📍 {placeName}
        </div>

        {/* Sensor name */}
        <div>📡 {sensor}</div>

        {/* Category + Zone - now human readable */}
        <div>
          🏷️ {detection.category || "Unknown"}
          {" • "}
          <span style={{ color: "#6b7280" }}>{zoneDisplay}</span>
        </div>

        {/* Confidence + Time */}
        <div>
          🎯 {(detection.confidence || 0).toFixed(1)}%
          &nbsp;|&nbsp;
          🕐 {time}
        </div>
      </div>

      {/* ── Row 3: Acknowledge button with loader ── */}
      {detection.status === "new" ? (
        <button
          onClick={handleAcknowledge}
          disabled={ackLoading}
          style={{
            marginTop      : "6px",
            width          : "100%",
            background     : ackLoading ? "#374151" : "#1f2937",
            color          : "white",
            border         : "none",
            borderRadius   : "6px",
            padding        : "5px",
            fontSize       : "11px",
            cursor         : ackLoading ? "not-allowed" : "pointer",
            display        : "flex",
            alignItems     : "center",
            justifyContent : "center",
            gap            : "6px",
            opacity        : ackLoading ? 0.7 : 1,
            transition     : "all 0.2s",
          }}
        >
          {ackLoading ? (
            <>
              <span style={{
                width          : "10px",
                height         : "10px",
                border         : "2px solid #6b7280",
                borderTopColor : "white",
                borderRadius   : "50%",
                display        : "inline-block",
                animation      : "spin 0.6s linear infinite",
              }} />
              Processing...
            </>
          ) : (
            "✓ Acknowledge"
          )}
        </button>
      ) : (
        <div style={{
          marginTop : "4px",
          textAlign : "center",
          fontSize  : "10px",
          color     : "#6b7280",
        }}>
          ✓ Acknowledged by Operator
        </div>
      )}
    </div>
  );
};

export default AlertCard;