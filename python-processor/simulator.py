import numpy as np
from signal_processor import process_rssi, FS

# ─────────────────────────────────────────
# SENSOR NODES
# Each sensor has a fixed GPS position
# Along the border line
# ─────────────────────────────────────────
SENSOR_NODES = [
    {"id": "NODE_1", "lat": 34.5120, "lng": 76.0980},
    {"id": "NODE_2", "lat": 34.5180, "lng": 76.1100},
    {"id": "NODE_3", "lat": 34.5220, "lng": 76.1250},
    {"id": "NODE_4", "lat": 34.5150, "lng": 76.1400},
    {"id": "NODE_5", "lat": 34.5080, "lng": 76.1520},
]

# ─────────────────────────────────────────
# INTRUDER SCENARIOS
# Simulated intruder paths
# Each scenario = one intruder situation
# ─────────────────────────────────────────
SCENARIOS = [
    {
        "name"      : "Single Walker",
        "activity"  : 1,        # 1=Walking
        "sensor_id" : "NODE_2", # which sensor detects
        "threat"    : 2,
    },
    {
        "name"      : "Running Intruder",
        "activity"  : 3,        # 3=Running
        "sensor_id" : "NODE_3",
        "threat"    : 3,
    },
    {
        "name"      : "Person Hiding",
        "activity"  : 2,        # 2=Breathing
        "sensor_id" : "NODE_4",
        "threat"    : 1,
    },
]

# ─────────────────────────────────────────
# ACTIVITY SETTINGS
# Same as your MATLAB code
# ─────────────────────────────────────────
ACT_FREQ = {1: 1.2,  2: 0.3,  3: 2.5}   # Hz
ACT_AMP  = {1: 3.0,  2: 2.0,  3: 5.0}   # amplitude
ACT_NAME = {1: "Walking", 2: "Breathing", 3: "Running"}

BASE_RSSI   = -65.0   # normal WiFi signal dBm
NOISE_LEVEL = 1.5     # background noise
DURATION    = 60      # seconds
N_SAMPLES   = DURATION * FS


# ─────────────────────────────────────────
# GENERATE RSSI FOR ONE SENSOR
# Simulates what one ESP32 would read
# ─────────────────────────────────────────
def generate_rssi(activity_id, start_sec, end_sec):
    t    = np.arange(N_SAMPLES) / FS
    rssi = np.zeros(N_SAMPLES)

    for i, time in enumerate(t):
        if start_sec <= time <= end_sec and activity_id > 0:
            freq     = ACT_FREQ[activity_id]
            amp      = ACT_AMP[activity_id]
            rssi[i]  = (BASE_RSSI
                        + amp * np.sin(2 * np.pi * freq * time)
                        + NOISE_LEVEL * np.random.randn())
        else:
            rssi[i]  = BASE_RSSI + NOISE_LEVEL * np.random.randn()

    return rssi.tolist()


# ─────────────────────────────────────────
# TRIANGULATE POSITION
# Use 2 sensors to estimate exact location
# Simple weighted average method
# ─────────────────────────────────────────
def triangulate(sensor_id, variance_value):
    # Find the sensor
    sensor = next((s for s in SENSOR_NODES
                   if s["id"] == sensor_id), None)

    if sensor is None:
        return None

    # Small random offset to simulate real position
    # In real system this uses proper math
    lat_offset = np.random.uniform(-0.0005, 0.0005)
    lng_offset = np.random.uniform(-0.0005, 0.0005)

    return {
        "lat"      : sensor["lat"] + lat_offset,
        "lng"      : sensor["lng"] + lng_offset,
        "accuracy" : 15,   # meters
    }


# ─────────────────────────────────────────
# RUN ONE SIMULATION SCENARIO
# Returns detection result with location
# ─────────────────────────────────────────
def run_scenario(scenario_index=None):
    np.random.seed()   # different result each time

    # Pick random scenario if not specified
    if scenario_index is None:
        scenario_index = np.random.randint(0, len(SCENARIOS))

    scenario   = SCENARIOS[scenario_index]
    activity   = scenario["activity"]
    sensor_id  = scenario["sensor_id"]

    # Activity happens from 15s to 45s
    rssi_data  = generate_rssi(activity, 15, 45)

    # Process the signal
    result     = process_rssi(rssi_data)

    # Get location
    location   = triangulate(sensor_id, result["variance"])

    # Build final detection event
    detection  = {
        "scenario"    : scenario["name"],
        "sensor_id"   : sensor_id,
        "is_motion"   : result["is_motion"],
        "activity"    : result["activity"] or ACT_NAME[activity],
        "threat_level": result["threat_level"] or scenario["threat"],
        "variance"    : result["variance"],
        "threshold"   : result["threshold"],
        "confidence"  : result["confidence"],
        "location"    : location,
    }

    return detection


# ─────────────────────────────────────────
# GET ALL SENSOR STATUS
# Simulates heartbeat from all nodes
# ─────────────────────────────────────────
def get_sensor_status():
    statuses = []
    for sensor in SENSOR_NODES:
        statuses.append({
            "id"           : sensor["id"],
            "lat"          : sensor["lat"],
            "lng"          : sensor["lng"],
            "status"       : "online",
            "battery"      : np.random.randint(70, 100),
            "signal"       : np.random.randint(-75, -55),
            "last_seen"    : "just now",
        })
    return statuses