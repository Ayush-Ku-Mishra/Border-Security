import random
import math

SENSOR_NODES = [
    {"id": "NODE_1", "lat": 34.5120, "lng": 76.0980},
    {"id": "NODE_2", "lat": 34.5180, "lng": 76.1100},
    {"id": "NODE_3", "lat": 34.5220, "lng": 76.1250},
    {"id": "NODE_4", "lat": 34.5150, "lng": 76.1400},
    {"id": "NODE_5", "lat": 34.5080, "lng": 76.1520},
]

ACTIVITIES = [
    {"label": "Walking",      "icon": "🚶", "threat": 2, "category": "Human"  },
    {"label": "Running",      "icon": "🏃", "threat": 3, "category": "Human"  },
    {"label": "Crawling",     "icon": "🪖", "threat": 3, "category": "Human"  },
    {"label": "Hiding",       "icon": "😮‍💨", "threat": 2, "category": "Human"  },
    {"label": "Motorcycle",   "icon": "🏍️", "threat": 3, "category": "Vehicle"},
    {"label": "Vehicle",      "icon": "🚗", "threat": 4, "category": "Vehicle"},
    {"label": "Truck",        "icon": "🚛", "threat": 4, "category": "Vehicle"},
    {"label": "Small Animal", "icon": "🐕", "threat": 0, "category": "Animal" },
    {"label": "Large Animal", "icon": "🐄", "threat": 1, "category": "Animal" },
]

# ─────────────────────────────────────────
# ZONE DISPLAY NAMES
# Human readable zone labels
# ─────────────────────────────────────────
ZONE_NAMES = {
    "inside_circle" : "Near Sensor Node",
    "on_border_line": "On Border Line",
    "between_nodes" : "Between Sensor Nodes",
    "approaching"   : "Approaching Border",
}


def random_position_near_node(node):
    # Bigger radius - 200m to 800m from node
    radius = random.uniform(0.002, 0.007)
    angle  = random.uniform(0, 2 * math.pi)
    lat    = node["lat"] + radius * math.cos(angle)
    lng    = node["lng"] + radius * math.sin(angle)
    return lat, lng


def random_position_on_line():
    idx   = random.randint(0, len(SENSOR_NODES) - 2)
    nodeA = SENSOR_NODES[idx]
    nodeB = SENSOR_NODES[idx + 1]
    t     = random.uniform(0.1, 0.9)
    lat   = nodeA["lat"] + t * (nodeB["lat"] - nodeA["lat"])
    lng   = nodeA["lng"] + t * (nodeB["lng"] - nodeA["lng"])
    # Bigger offset from line
    lat  += random.uniform(-0.003, 0.003)
    lng  += random.uniform(-0.003, 0.003)
    return lat, lng


def find_nearest_node(lat, lng):
    nearest  = None
    min_dist = float("inf")
    for node in SENSOR_NODES:
        d = math.sqrt(
            (lat - node["lat"]) ** 2 +
            (lng - node["lng"]) ** 2
        )
        if d < min_dist:
            min_dist = d
            nearest  = node
    return nearest, min_dist * 111000


def all_node_distances(lat, lng):
    result = {}
    for node in SENSOR_NODES:
        d = math.sqrt(
            (lat - node["lat"]) ** 2 +
            (lng - node["lng"]) ** 2
        ) * 111000
        result[node["id"]] = round(d, 1)
    return result


def run_scenario(scenario_index=None):
    activity    = random.choice(ACTIVITIES)
    target_node = random.choice(SENSOR_NODES)
    zone_choice = random.randint(1, 3)

    if zone_choice == 1:
        lat, lng = random_position_near_node(target_node)
        zone_key = "inside_circle"

    elif zone_choice == 2:
        lat, lng = random_position_on_line()
        zone_key = "on_border_line"

    else:
        all_lats = [n["lat"] for n in SENSOR_NODES]
        all_lngs = [n["lng"] for n in SENSOR_NODES]
        # Much wider spread
        lat      = random.uniform(
            min(all_lats) - 0.015,
            max(all_lats) + 0.015
        )
        lng      = random.uniform(
            min(all_lngs) - 0.015,
            max(all_lngs) + 0.015
        )
        zone_key = "between_nodes"

    nearest, dist_m = find_nearest_node(lat, lng)

    if dist_m < 100:
        conf = random.uniform(82, 98)
    elif dist_m < 300:
        conf = random.uniform(65, 82)
    elif dist_m < 600:
        conf = random.uniform(48, 65)
    else:
        conf = random.uniform(35, 50)

    variance  = random.uniform(2.5, 18.0)
    threshold = random.uniform(0.8, variance * 0.75)

    return {
        "scenario"      : f"{activity['category']} - {activity['label']}",
        "sensor_id"     : nearest["id"],
        "is_motion"     : True,
        "activity"      : activity["label"],
        "icon"          : activity["icon"],
        "category"      : activity["category"],
        "threat_level"  : activity["threat"],
        "variance"      : round(variance,  4),
        "threshold"     : round(threshold, 4),
        "confidence"    : round(conf,      1),
        "zone"          : zone_key,
        "zone_label"    : ZONE_NAMES[zone_key],
        "location"      : {
            "lat"      : round(lat, 6),
            "lng"      : round(lng, 6),
            "accuracy" : 15,
        },
        "node_distances": all_node_distances(lat, lng),
    }


def get_sensor_status():
    result = []
    for sensor in SENSOR_NODES:
        result.append({
            "id"       : sensor["id"],
            "lat"      : sensor["lat"],
            "lng"      : sensor["lng"],
            "status"   : "online",
            "battery"  : random.randint(70, 100),
            "signal"   : random.randint(-75, -55),
            "last_seen": "just now",
        })
    return result