import express from "express";
import axios from "axios";

const router = express.Router();
const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000";

// ─────────────────────────────────────────
// GET /api/sensors
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const pythonRes = await axios.get(`${PYTHON_API}/sensors`, {
      timeout: 30000,
    });
    const sensors = pythonRes.data.sensors;
    res.json({ success: true, count: sensors.length, sensors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/sensors/:id
// ─────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const pythonRes = await axios.get(`${PYTHON_API}/sensors`, {
      timeout: 30000,
    });
    const sensors = pythonRes.data.sensors;
    const sensor = sensors.find((s) => s.id === req.params.id);

    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: "Sensor not found",
      });
    }

    res.json({ success: true, sensor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
