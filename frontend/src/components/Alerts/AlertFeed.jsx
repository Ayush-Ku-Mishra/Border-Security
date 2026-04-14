import AlertCard from "./AlertCard";

const AlertFeed = ({ detections, onAcknowledge }) => {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: "11px",
          }}
        >
          🚨 LIVE ALERTS
        </span>
        <span
          style={{
            background: "#dc2626",
            color: "white",
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "999px",
            fontWeight: "bold",
          }}
        >
          {detections.length}
        </span>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: "#ef4444 #111827",
          minHeight: 0,
          paddingRight: "2px",
        }}
      >
        {detections.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#6b7280",
              marginTop: "40px",
            }}
          >
            <div style={{ fontSize: "28px" }}>🟢</div>
            <div style={{ fontSize: "12px", marginTop: "8px" }}>No alerts</div>
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              Border is secure
            </div>
          </div>
        ) : (
          detections.map((det) => (
            <AlertCard
              key={det.detectionId || det._id}
              detection={det}
              onAcknowledge={onAcknowledge}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertFeed;
