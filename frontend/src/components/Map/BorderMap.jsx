import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─────────────────────────────────────────
// SENSOR REAL NAMES
// Change these to real place names
// ─────────────────────────────────────────
const SENSOR_NAMES = {
  NODE_1: "Kargil Post Alpha",
  NODE_2: "Drass Checkpoint",
  NODE_3: "Batalik Ridge",
  NODE_4: "Mushkoh Valley",
  NODE_5: "Suru River Post",
};

const THREAT_COLORS = {
  0: "#22c55e",
  1: "#3b82f6",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
};

const THREAT_LABELS = {
  0: "No Threat",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

// ─────────────────────────────────────────
// CALCULATE DIRECTION
// ─────────────────────────────────────────
const getDirection = (lat1, lng1, lat2, lng2) => {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  const normalized = (angle + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return "↑ North";
  if (normalized >= 22.5 && normalized < 67.5) return "↗ North-East";
  if (normalized >= 67.5 && normalized < 112.5) return "→ East";
  if (normalized >= 112.5 && normalized < 157.5) return "↘ South-East";
  if (normalized >= 157.5 && normalized < 202.5) return "↓ South";
  if (normalized >= 202.5 && normalized < 247.5) return "↙ South-West";
  if (normalized >= 247.5 && normalized < 292.5) return "← West";
  return "↖ North-West";
};

// ─────────────────────────────────────────
// REVERSE GEOCODE
// ─────────────────────────────────────────
const reverseGeocode = async (lat, lng) => {
  try {
    const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${BASE}/detections/geocode?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    return data.place || "Border Zone";
  } catch {
    return "Border Zone";
  }
};

const getEmoji = (activity) => {
  const map = {
    Walking: "🚶",
    Running: "🏃",
    Hiding: "😮‍💨",
    Crawling: "🪖",
    Motorcycle: "🏍️",
    Vehicle: "🚗",
    Truck: "🚛",
    "Large Animal": "🐄",
    "Small Animal": "🐕",
    Unknown: "❓",
  };
  return map[activity] || "❓";
};

// ─────────────────────────────────────────
// BLINKING DETECTION ICON
// High threat blinks faster
// ─────────────────────────────────────────
const createDetectionIcon = (
  threatLevel,
  activity = "",
  icon = "",
  isNew = false,
) => {
  const color = THREAT_COLORS[threatLevel] || "#ef4444";
  const size = threatLevel >= 3 ? 44 : 36;
  const animation =
    threatLevel >= 3
      ? "blink-fast 0.5s infinite"
      : isNew
        ? "blink-slow 1.2s infinite"
        : "none";

  const emoji = icon || getEmoji(activity);

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width          : ${size}px;
        height         : ${size}px;
        background     : ${color}22;
        border         : 3px solid ${color};
        border-radius  : 50%;
        box-shadow     : 0 0 15px ${color}88;
        animation      : ${animation};
        cursor         : pointer;
        display        : flex;
        align-items    : center;
        justify-content: center;
        font-size      : ${size * 0.5}px;
        line-height    : 1;
      ">${emoji}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const sensorIcon = (name) =>
  L.divIcon({
    className: "",
    html: `
    <div style="
      display        : flex;
      flex-direction : column;
      align-items    : center;
    ">
      <div style="
        width        : 14px;
        height       : 14px;
        background   : #06b6d4;
        border       : 2px solid white;
        border-radius: 3px;
        box-shadow   : 0 0 6px #06b6d4;
      "></div>
      <div style="
        color      : white;
        font-size  : 9px;
        background : rgba(0,0,0,0.7);
        padding    : 1px 3px;
        border-radius: 3px;
        margin-top : 2px;
        white-space: nowrap;
      ">${name}</div>
    </div>
  `,
    iconSize: [80, 30],
    iconAnchor: [40, 7],
  });

// ─────────────────────────────────────────
// INJECT CSS FOR ANIMATIONS
// ─────────────────────────────────────────
const InjectStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes blink-fast {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.3; transform: scale(1.4); }
      }
      @keyframes blink-slow {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.6; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ─────────────────────────────────────────
// FLY TO DETECTION
// ─────────────────────────────────────────
const FlyToDetection = ({ detection }) => {
  const map = useMap();
  useEffect(() => {
    if (detection?.location) {
      map.flyTo([detection.location.lat, detection.location.lng], 15, {
        duration: 1.5,
      });
    }
  }, [detection, map]);
  return null;
};

// ─────────────────────────────────────────
// COMPASS ROSE
// ─────────────────────────────────────────
const CompassRose = () => (
  <div
    style={{
      position: "absolute",
      top: "10px",
      right: "10px",
      zIndex: 1000,
      background: "rgba(0,0,0,0.8)",
      borderRadius: "50%",
      width: "80px",
      height: "80px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid rgba(255,255,255,0.2)",
      pointerEvents: "none",
    }}
  >
    <div style={{ position: "relative", width: "70px", height: "70px" }}>
      {[
        {
          label: "N",
          top: "2px",
          left: "50%",
          tx: "-50%",
          ty: "0",
          color: "#ef4444",
        },
        {
          label: "S",
          bottom: "2px",
          left: "50%",
          tx: "-50%",
          ty: "0",
          color: "white",
        },
        {
          label: "E",
          right: "4px",
          top: "50%",
          tx: "0",
          ty: "-50%",
          color: "white",
        },
        {
          label: "W",
          left: "4px",
          top: "50%",
          tx: "0",
          ty: "-50%",
          color: "white",
        },
      ].map(({ label, color, ...pos }) => (
        <div
          key={label}
          style={{
            position: "absolute",
            color,
            fontSize: "11px",
            fontWeight: "bold",
            transform: `translate(${pos.tx || "0"}, ${pos.ty || "0"})`,
            ...pos,
          }}
        >
          {label}
        </div>
      ))}

      {/* North arrow red */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -100%)",
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderBottom: "20px solid #ef4444",
        }}
      />

      {/* South arrow grey */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, 0%)",
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "20px solid #6b7280",
        }}
      />

      {/* Center dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "8px",
          height: "8px",
          background: "white",
          borderRadius: "50%",
        }}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────
// SINGLE DETECTION MARKER
// ─────────────────────────────────────────
// In DetectionMarker component
const DetectionMarker = ({ det, prevDet, isNew }) => {
  const [placeName, setPlaceName] = useState("Locating...");

  useEffect(() => {
    reverseGeocode(det.location.lat, det.location.lng).then(setPlaceName);
  }, [det.location.lat, det.location.lng]);

  const direction = prevDet?.location
    ? getDirection(
        prevDet.location.lat,
        prevDet.location.lng,
        det.location.lat,
        det.location.lng,
      )
    : null;

  // ── FIX: Fallback chain for icon ──
  const displayIcon =
    det.icon && det.icon !== "❓" ? det.icon : getEmoji(det.activity);

  return (
    <Marker
      position={[det.location.lat, det.location.lng]}
      icon={createDetectionIcon(
        det.threatLevel,
        det.activity,
        displayIcon, // ← pass correct icon
        isNew,
      )}
    >
      <Popup minWidth={230}>
        <div style={{ fontFamily: "sans-serif", fontSize: "13px" }}>
          {/* Threat level */}
          <div
            style={{
              color: THREAT_COLORS[det.threatLevel],
              fontWeight: "bold",
              fontSize: "15px",
              marginBottom: "6px",
            }}
          >
            ⚠️ {THREAT_LABELS[det.threatLevel]?.toUpperCase()} THREAT
          </div>

          <hr style={{ margin: "6px 0", opacity: 0.3 }} />

          <p>
            <b>🏃 Activity:</b> {det.activity}
          </p>
          <p>
            <b>📡 Sensor:</b> {SENSOR_NAMES[det.sensorId] || det.sensorId}
          </p>
          <p>
            <b>📍 Location:</b> {placeName}
          </p>

          {/* GPS */}
          <p style={{ fontSize: "11px", color: "#888" }}>
            Lat: {det.location.lat.toFixed(5)} | Lng:{" "}
            {det.location.lng.toFixed(5)}
          </p>

          {/* Direction */}
          {direction && (
            <p>
              <b>🧭 Direction:</b> {direction}
            </p>
          )}

          <p>
            <b>🎯 Accuracy:</b> ±{det.location.accuracy}m
          </p>
          <p>
            <b>📊 Confidence:</b> {det.confidence?.toFixed(1)}%
          </p>

          <p style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>
            🕐 {new Date(det.createdAt || det.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

// ─────────────────────────────────────────
// BORDER LINE
// ─────────────────────────────────────────
const BorderLine = ({ sensors }) => {
  if (!sensors?.length) return null;
  return (
    <Polyline
      positions={sensors.map((s) => [s.lat, s.lng])}
      color="#ef4444"
      weight={3}
      dashArray="10 5"
      opacity={0.8}
    />
  );
};

// ─────────────────────────────────────────
// MAIN BORDER MAP
// ─────────────────────────────────────────
const BorderMap = ({ detections, sensors, lastDetection }) => {
  const center = [34.515, 76.125];

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <InjectStyles />
      <CompassRose />

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />

        {lastDetection && <FlyToDetection detection={lastDetection} />}

        <BorderLine sensors={sensors} />

        {/* Sensor Nodes */}
        {sensors.map((sensor) => (
          <Marker
            key={sensor.id}
            position={[sensor.lat, sensor.lng]}
            icon={sensorIcon(SENSOR_NAMES[sensor.id] || sensor.id)}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: "13px" }}>
                <p
                  style={{
                    color: "#06b6d4",
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  📡 {SENSOR_NAMES[sensor.id] || sensor.id}
                </p>
                <hr style={{ margin: "4px 0", opacity: 0.2 }} />
                <p>
                  <b>Status:</b> {sensor.status}
                </p>
                <p>
                  <b>Battery:</b> {sensor.battery}%
                </p>
                <p>
                  <b>Signal:</b> {sensor.signal} dBm
                </p>
                <p
                  style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}
                >
                  📍 {sensor.lat.toFixed(4)}, {sensor.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
            <Circle
              center={[sensor.lat, sensor.lng]}
              radius={200}
              color="#06b6d4"
              fillOpacity={0.05}
              weight={1}
            />
          </Marker>
        ))}

        {/* Detection Markers */}
        {detections.map(
          (det, index) =>
            det.location && (
              <DetectionMarker
                key={det.detectionId || det._id}
                det={det}
                prevDet={detections[index + 1] || null}
                isNew={index === 0}
              />
            ),
        )}
      </MapContainer>
    </div>
  );
};

export default BorderMap;
