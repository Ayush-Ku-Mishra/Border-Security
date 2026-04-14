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

const ThreatChart = ({ detections }) => {
  const counts = detections.reduce((acc, det) => {
    const act = det.activity || "Unknown";
    acc[act] = (acc[act] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));

  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-white font-bold text-xs mb-1">📊 ACTIVITY</h2>
        <div
          className="flex-1 flex items-center
          justify-center text-gray-500 text-xs"
        >
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-white font-bold text-xs mb-1">
        📊 ACTIVITY BREAKDOWN
      </h2>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={30}
              outerRadius={50}
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
