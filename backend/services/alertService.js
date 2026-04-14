const THREAT_LABELS = {
  0: "NO THREAT",
  1: "LOW",
  2: "MEDIUM",
  3: "HIGH",
  4: "CRITICAL",
};

const THREAT_COLORS = {
  0: "green",
  1: "blue",
  2: "yellow",
  3: "orange",
  4: "red",
};

// ─────────────────────────────────────────
// FORMAT ALERT MESSAGE
// ─────────────────────────────────────────
export const formatAlertMessage = (detection) => {
  const threat = THREAT_LABELS[detection.threatLevel] || "UNKNOWN";
  const color = THREAT_COLORS[detection.threatLevel] || "grey";

  return {
    title: `⚠️ BORDER ALERT - ${threat}`,
    message: `Activity: ${detection.activity} | 
                  Sensor: ${detection.sensorId} | 
                  Location: ${detection.location.lat.toFixed(4)}, 
                  ${detection.location.lng.toFixed(4)}`,
    threatLevel: detection.threatLevel,
    threatLabel: threat,
    color: color,
    sound: detection.threatLevel >= 3 ? true : false,
  };
};

// ─────────────────────────────────────────
// PROCESS ALERT
// ─────────────────────────────────────────
export const processAlert = (detection, io) => {
  if (!detection.isMotion) return null;

  const alert = formatAlertMessage(detection);

  console.log(`\n🚨 ALERT: ${alert.title}`);
  console.log(`   ${alert.message}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  if (io) {
    io.emit("new_alert", {
      ...alert,
      detection,
      timestamp: new Date().toISOString(),
    });
  }

  return alert;
};
