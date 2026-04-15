import express from "express";
import axios from "axios";
import Detection from "../models/Detection.js";
import { processAlert } from "../services/alertService.js";
import { emitDetection, emitClearAll } from "../services/socketService.js";

const router = express.Router();
const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000";

// ─────────────────────────────────────────
// GET /api/detections
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const detections = await Detection.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: detections.length, detections });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/detections/live
// ─────────────────────────────────────────
router.get("/live", async (req, res) => {
  try {
    const pythonRes = await axios.get(`${PYTHON_API}/detect`, {
      timeout: 30000,
    });
    const raw = pythonRes.data;

    const detection = new Detection({
      detectionId: raw.id,
      scenarioName: raw.scenario,
      sensorId: raw.sensor_id,
      isMotion: raw.is_motion,
      activity: raw.activity || "Unknown",
      threatLevel: raw.threat_level,
      variance: raw.variance,
      threshold: raw.threshold,
      confidence: raw.confidence,
      location: raw.location,
      status: "new",
    });

    await detection.save();
    emitDetection(detection);
    processAlert(detection, null);

    res.json({ success: true, detection });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/detections/simulate
// ─────────────────────────────────────────
router.get("/simulate", async (req, res) => {
  try {
    const results = [];
    for (let i = 0; i < 3; i++) {
      const pythonRes = await axios.get(`${PYTHON_API}/detect/${i}`, {
        timeout: 30000,
      });
      const raw = pythonRes.data;

      const detection = new Detection({
        detectionId: raw.id,
        scenarioName: raw.scenario,
        sensorId: raw.sensor_id,
        isMotion: raw.is_motion,
        activity: raw.activity || "Unknown",
        threatLevel: raw.threat_level,
        variance: raw.variance,
        threshold: raw.threshold,
        confidence: raw.confidence,
        location: raw.location,
        status: "new",
      });

      await detection.save();
      emitDetection(detection);
      results.push(detection);
    }

    res.json({ success: true, count: results.length, detections: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/detections/:id/acknowledge
// ─────────────────────────────────────────
router.patch("/:id/acknowledge", async (req, res) => {
  try {
    const detection = await Detection.findByIdAndUpdate(
      req.params.id,
      {
        status: "acknowledged",
        acknowledgedBy: req.body.operator || "Operator",
        notes: req.body.notes || "",
      },
      { new: true },
    );
    res.json({ success: true, detection });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/detections
// ─────────────────────────────────────────
router.delete("/", async (req, res) => {
  try {
    await Detection.deleteMany({});

    // Emit to all connected dashboards
    emitClearAll();

    res.json({ success: true, message: "All detections cleared" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/geocode
// Proxy for Nominatim reverse geocoding
// Fixes CORS issue in production
// ─────────────────────────────────────────
router.get("/geocode", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.json({ place: "Border Zone" });
    }

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: { lat, lon: lng, format: "json" },
        headers: {
          "User-Agent": "BorderSecuritySystem/1.0",
        },
      },
    );

    const addr = response.data.address || {};
    const place =
      addr.village ||
      addr.town ||
      addr.suburb ||
      addr.county ||
      addr.state_district ||
      addr.state ||
      "Border Zone";

    res.json({ place });
  } catch {
    res.json({ place: "Border Zone" });
  }
});

export default router;
