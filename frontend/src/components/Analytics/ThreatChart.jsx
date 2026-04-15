import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  Walking: "#f97316",
  Running: "#ef4444",
  Breathing: "#3b82f6",
  Unknown: "#6b7280",
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
};

import { useState, useEffect } from "react";

const ThreatChart = ({ detections }) => {
  const isMobile = useIsMobile();

  const counts = detections.reduce((acc, det) => {
    const act = det.activity || "Unknown";
    acc[act] = (acc[act] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));

  // Bigger radius on mobile
  const innerR = isMobile ? 55 : 30;
  const outerR = isMobile ? 90 : 50;

  if (data.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: "11px",
            marginBottom: "6px",
          }}
        >
          📊 ACTIVITY
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            fontSize: "12px",
          }}
        >
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          color: "white",
          fontWeight: "bold",
          fontSize: "11px",
          marginBottom: "6px",
          flexShrink: 0,
        }}
      >
        📊 ACTIVITY BREAKDOWN
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] || "#6b7280"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "11px",
              }}
            />
            <Legend
              iconSize={8}
              formatter={(value) => (
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "10px",
                  }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ThreatChart;
