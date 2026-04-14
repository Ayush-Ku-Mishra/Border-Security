const SENSOR_NAMES = {
  NODE_1: "Kargil Post Alpha",
  NODE_2: "Drass Checkpoint",
  NODE_3: "Batalik Ridge",
  NODE_4: "Mushkoh Valley",
  NODE_5: "Suru River Post",
};

const SensorStatus = ({ sensors }) => {
  return (
    <div>
      <div
        style={{
          color: "white",
          fontWeight: "bold",
          fontSize: "11px",
          marginBottom: "8px",
        }}
      >
        📡 SENSOR NODES
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {sensors.map((sensor) => (
          <div
            key={sensor.id}
            style={{
              background: "#1f2937",
              borderRadius: "6px",
              padding: "5px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Left */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background:
                    sensor.status === "online" ? "#4ade80" : "#f87171",
                }}
              />
              <span
                style={{
                  color: "white",
                  fontSize: "11px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {SENSOR_NAMES[sensor.id] || sensor.id}
              </span>
            </div>

            {/* Right */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                fontSize: "10px",
                color: "#9ca3af",
                flexShrink: 0,
              }}
            >
              <span>🔋{sensor.battery}%</span>
              <span>{sensor.signal}dBm</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorStatus;
