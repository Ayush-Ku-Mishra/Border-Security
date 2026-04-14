import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import detectionRoutes from "./routes/detections.js";
import sensorRoutes from "./routes/sensors.js";
import { initSocket } from "./services/socketService.js";

dotenv.config();

// ─────────────────────────────────────────
// CREATE APP
// ─────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", FRONTEND_URL],
    methods: ["GET", "POST"],
  },
});

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", FRONTEND_URL],
  }),
);
app.use(express.json());

// ─────────────────────────────────────────
// MONGODB CONNECTION
// ─────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URL, {
    dbName: process.env.DB_NAME,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ─────────────────────────────────────────
// SOCKET
// ─────────────────────────────────────────
initSocket(io);

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────
app.use("/api/detections", detectionRoutes);
app.use("/api/sensors", sensorRoutes);

// ─────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Border Security Node.js API running",
    status: "ok",
    ports: {
      node: process.env.PORT,
      python: process.env.PYTHON_API,
    },
  });
});

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Node.js server running on port ${PORT}`);
  console.log(`✅ Python API at ${process.env.PYTHON_API}`);
  console.log(`✅ MongoDB at ${process.env.MONGO_URL}`);
});
