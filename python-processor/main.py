from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import asyncio
import random

from simulator import run_scenario, get_sensor_status
from signal_processor import FS

# ─────────────────────────────────────────
# CREATE FASTAPI APP
# Same concept as Express.js app
# ─────────────────────────────────────────
app = FastAPI(title="Border Security API")

# ─────────────────────────────────────────
# CORS SETTINGS
# Allow React frontend to call this API
# Same concept as cors in Express.js
# ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173"],  # React vite port
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ─────────────────────────────────────────
# STORE RECENT DETECTIONS IN MEMORY
# Later we will save to MongoDB
# ─────────────────────────────────────────
recent_detections = []


# ─────────────────────────────────────────
# HELPER - ADD TIMESTAMP AND ID
# ─────────────────────────────────────────
def format_detection(raw):
    raw["id"]        = f"DET_{random.randint(10000,99999)}"
    raw["timestamp"] = datetime.utcnow().isoformat() + "Z"
    raw["status"]    = "new"
    return raw


# ─────────────────────────────────────────
# ROUTE 1: ROOT
# Test if server is running
# GET http://localhost:8000/
# ─────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message" : "Border Security Python API is running",
        "status"  : "ok"
    }


# ─────────────────────────────────────────
# ROUTE 2: GET SINGLE DETECTION
# Runs one simulation and returns result
# GET http://localhost:8000/detect
# ─────────────────────────────────────────
@app.get("/detect")
def detect():
    raw       = run_scenario()
    detection = format_detection(raw)

    # Keep only last 50 detections in memory
    recent_detections.append(detection)
    if len(recent_detections) > 50:
        recent_detections.pop(0)

    return detection


# ─────────────────────────────────────────
# ROUTE 3: GET ALL RECENT DETECTIONS
# Returns last 50 detections
# GET http://localhost:8000/detections
# ─────────────────────────────────────────
@app.get("/detections")
def get_detections():
    return {
        "count"      : len(recent_detections),
        "detections" : list(reversed(recent_detections))
    }


# ─────────────────────────────────────────
# ROUTE 4: GET SENSOR STATUS
# Returns all sensor node health info
# GET http://localhost:8000/sensors
# ─────────────────────────────────────────
@app.get("/sensors")
def get_sensors():
    return {
        "count"   : 5,
        "sensors" : get_sensor_status()
    }


# ─────────────────────────────────────────
# ROUTE 5: RUN SPECIFIC SCENARIO
# 0 = Walker, 1 = Runner, 2 = Hiding
# GET http://localhost:8000/detect/0
# ─────────────────────────────────────────
@app.get("/detect/{scenario_id}")
def detect_scenario(scenario_id: int):
    if scenario_id not in [0, 1, 2]:
        return {"error": "scenario_id must be 0, 1 or 2"}

    raw       = run_scenario(scenario_id)
    detection = format_detection(raw)

    recent_detections.append(detection)
    if len(recent_detections) > 50:
        recent_detections.pop(0)

    return detection


# ─────────────────────────────────────────
# ROUTE 6: CLEAR ALL DETECTIONS
# DELETE http://localhost:8000/detections
# ─────────────────────────────────────────
@app.delete("/detections")
def clear_detections():
    recent_detections.clear()
    return {"message": "All detections cleared"}