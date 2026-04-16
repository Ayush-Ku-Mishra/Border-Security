import mongoose from "mongoose";

const DetectionSchema = new mongoose.Schema(
  {
    detectionId: {
      type    : String,
      required: true,
      unique  : true,
    },
    scenarioName: {
      type   : String,
      default: "Unknown",
    },
    sensorId: {
      type    : String,
      required: true,
    },
    isMotion: {
      type   : Boolean,
      default: false,
    },
    activity: {
      type   : String,
      enum   : [
        "Walking", "Running", "Hiding", "Crawling",
        "Motorcycle", "Vehicle", "Truck",
        "Large Animal", "Small Animal", "Unknown",
      ],
      default: "Unknown",
    },
    icon: {
      type   : String,
      default: "❓",
    },
    category: {
      type   : String,
      enum   : ["Human", "Vehicle", "Animal", "Unknown"],
      default: "Unknown",
    },
    zone: {
      type   : String,
      default: "unknown",
    },
    // ── NEW: Human readable zone label ──
    zoneLabel: {
      type   : String,
      default: "Unknown Area",
    },
    nodeDistances: {
      type   : Object,
      default: {},
    },
    threatLevel: {
      type   : Number,
      min    : 0,
      max    : 4,
      default: 0,
    },
    variance: {
      type   : Number,
      default: 0,
    },
    threshold: {
      type   : Number,
      default: 0,
    },
    confidence: {
      type   : Number,
      default: 0,
    },
    location: {
      lat     : { type: Number, required: true },
      lng     : { type: Number, required: true },
      accuracy: { type: Number, default: 15    },
    },
    status: {
      type   : String,
      enum   : ["new", "acknowledged", "resolved", "false_alarm"],
      default: "new",
    },
    acknowledgedBy: {
      type   : String,
      default: null,
    },
    notes: {
      type   : String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Detection", DetectionSchema);