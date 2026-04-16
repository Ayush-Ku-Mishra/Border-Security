import random
import time
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Make sure these files exist and are correct
from simulator import run_scenario, get_sensor_status

# ----------------------------------------------------
#  1. CREATE THE APP
# ----------------------------------------------------
app = FastAPI(title="Border Security Python API")

# ----------------------------------------------------
#  2. ADD CORS MIDDLEWARE
#  Allows any origin to call this API
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for recent detections
recent_detections = []


# ----------------------------------------------------
#  3. HELPER FUNCTION TO FORMAT DATA
# ----------------------------------------------------
def format_detection(raw_data):
    """Adds a unique ID and timestamp to the raw detection data."""
    unique_id = f"DET_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    raw_data["id"] = unique_id
    raw_data["timestamp"] = datetime.utcnow().isoformat() + "Z"
    raw_data["status"] = "new"
    return raw_data


# ----------------------------------------------------
#  4. DEFINE ALL API ROUTES
# ----------------------------------------------------

# THIS IS THE MISSING ROUTE
@app.get("/")
def get_root():
    """Root endpoint to confirm the API is running."""
    return {"message": "Border Security Python API is running", "status": "ok"}


@app.get("/health")
def get_health():
    """Health check endpoint for Render."""
    return {"status": "healthy"}


@app.get("/detect")
def get_detection():
    """Generates a single, random detection scenario."""
    raw_detection = run_scenario()
    formatted_detection = format_detection(raw_detection)

    # Store in memory
    recent_detections.insert(0, formatted_detection)
    if len(recent_detections) > 100:
        recent_detections.pop()

    return formatted_detection


@app.get("/sensors")
def get_all_sensors():
    """Returns the status of all sensor nodes."""
    return {
        "count": 5,
        "sensors": get_sensor_status(),
    }


# This route is kept for backward compatibility but is now also random
@app.get("/detect/{scenario_id}")
def get_detection_by_id(scenario_id: int):
    """Generates a random detection, ignoring the scenario_id."""
    return get_detection()


@app.get("/detections")
def get_all_detections():
    """Returns all recent detections stored in memory."""
    return {
        "count": len(recent_detections),
        "detections": recent_detections,
    }


@app.delete("/detections")
def clear_all_detections():
    """Clears all detections from memory."""
    recent_detections.clear()
    return {"message": "All detections cleared successfully"}