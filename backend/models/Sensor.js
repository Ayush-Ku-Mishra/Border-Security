import mongoose from "mongoose";

const SensorSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    coverageRadius: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ["online", "offline", "maintenance"],
      default: "online",
    },
    battery: {
      type: Number,
      default: 100,
    },
    signal: {
      type: Number,
      default: -65,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Sensor", SensorSchema);