let ioInstance = null;

// ─────────────────────────────────────────
// INITIALIZE SOCKET
// ─────────────────────────────────────────
export const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`✅ Dashboard connected: ${socket.id}`);

    socket.emit("connected", {
      message: "Connected to Border Security System",
      timestamp: new Date().toISOString(),
    });

    socket.on("acknowledge_alert", (data) => {
      console.log(`✅ Alert acknowledged: ${data.detectionId}`);
      socket.broadcast.emit("alert_acknowledged", data);
    });

    socket.on("mark_false_alarm", (data) => {
      console.log(`ℹ️ False alarm marked: ${data.detectionId}`);
      socket.broadcast.emit("false_alarm_marked", data);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Dashboard disconnected: ${socket.id}`);
    });
  });
};

// ─────────────────────────────────────────
// EMIT NEW DETECTION
// ─────────────────────────────────────────
export const emitDetection = (detection) => {
  if (ioInstance) {
    ioInstance.emit("new_detection", {
      ...detection.toObject(),
      timestamp: new Date().toISOString(),
    });
  }
};

// ─────────────────────────────────────────
// EMIT SENSOR UPDATE
// ─────────────────────────────────────────
export const emitSensorUpdate = (sensors) => {
  if (ioInstance) {
    ioInstance.emit("sensor_update", sensors);
  }
};

export const emitClearAll = () => {
  if (ioInstance) {
    ioInstance.emit("clear_all");
  }
};
