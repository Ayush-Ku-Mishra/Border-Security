import numpy as np
from scipy.signal import butter, filtfilt

# ─────────────────────────────────────────
# SETTINGS  (same as your MATLAB code)
# ─────────────────────────────────────────
FS           = 20       # sampling rate 20 Hz
WINDOW_SEC   = 3        # sliding window 3 seconds
WINDOW_SIZE  = WINDOW_SEC * FS   # = 60 samples
BASELINE_SEC = 10       # first 10 seconds = no motion
BASELINE_N   = BASELINE_SEC * FS # = 200 samples
K_THRESHOLD  = 1.2      # mean + 2.5 * std

# ─────────────────────────────────────────
# BANDPASS FILTER DESIGNER
# Same as butter() in MATLAB
# ─────────────────────────────────────────
def make_bandpass(low, high, fs=FS):
    b, a = butter(2, [low, high], btype='bandpass', fs=fs)
    return b, a

# Design 3 filters (same as your MATLAB code)
B_BREATH, A_BREATH = make_bandpass(0.10, 0.60)  # breathing
B_WALK,   A_WALK   = make_bandpass(0.80, 1.80)  # walking
B_RUN,    A_RUN    = make_bandpass(2.00, 4.00)  # running


# ─────────────────────────────────────────
# CALCULATE VARIANCE (sliding window)
# Same as your MATLAB variance loop
# ─────────────────────────────────────────
def calculate_variance(rssi_array):
    n        = len(rssi_array)
    variance = np.zeros(n)
    for i in range(n):
        start       = max(0, i - WINDOW_SIZE + 1)
        segment     = rssi_array[start:i+1]
        variance[i] = np.var(segment)
    return variance


# ─────────────────────────────────────────
# CALCULATE BASELINE THRESHOLD
# Same as your MATLAB baseline section
# ─────────────────────────────────────────
def calculate_threshold(variance_array):
    baseline      = variance_array[:BASELINE_N]
    baseline_mean = np.mean(baseline)
    baseline_std  = np.std(baseline)
    threshold     = baseline_mean + K_THRESHOLD * baseline_std
    return threshold, baseline_mean, baseline_std


# ─────────────────────────────────────────
# CALCULATE BAND ENERGIES
# Same as your MATLAB band energy loop
# ─────────────────────────────────────────
def calculate_band_energies(rssi_array):
    # Filter signal into 3 bands
    sig_breath = filtfilt(B_BREATH, A_BREATH, rssi_array)
    sig_walk   = filtfilt(B_WALK,   A_WALK,   rssi_array)
    sig_run    = filtfilt(B_RUN,    A_RUN,    rssi_array)

    n             = len(rssi_array)
    energy_breath = np.zeros(n)
    energy_walk   = np.zeros(n)
    energy_run    = np.zeros(n)

    for i in range(n):
        start              = max(0, i - WINDOW_SIZE + 1)
        energy_breath[i]   = np.mean(sig_breath[start:i+1] ** 2)
        energy_walk[i]     = np.mean(sig_walk[start:i+1]   ** 2)
        energy_run[i]      = np.mean(sig_run[start:i+1]    ** 2)

    return energy_breath, energy_walk, energy_run


# ─────────────────────────────────────────
# CLASSIFY ACTIVITY
# Same logic as your MATLAB classification
# ─────────────────────────────────────────
def classify_activity(bE, wE, rE,
                       breath_thresh,
                       walk_thresh,
                       run_thresh):
    if rE > run_thresh and rE >= wE and rE >= bE:
        return "Running"
    elif wE > walk_thresh and wE >= bE:
        return "Walking"
    elif bE > breath_thresh:
        return "Breathing"
    else:
        energies = [bE, wE, rE]
        idx      = int(np.argmax(energies))
        return ["Breathing", "Walking", "Running"][idx]


# ─────────────────────────────────────────
# THREAT LEVEL
# New for border security
# ─────────────────────────────────────────
def get_threat_level(activity):
    mapping = {
        "Breathing" : 1,   # LOW    - person resting/hiding
        "Walking"   : 2,   # MEDIUM - person approaching
        "Running"   : 3,   # HIGH   - person rushing border
    }
    return mapping.get(activity, 1)


# ─────────────────────────────────────────
# MAIN PROCESS FUNCTION
# Call this with rssi array
# Returns detection result
# ─────────────────────────────────────────
def process_rssi(rssi_array):
    rssi = np.array(rssi_array)

    # Step 1: Calculate variance
    variance  = calculate_variance(rssi)

    # Step 2: Get threshold from baseline
    threshold, b_mean, b_std = calculate_threshold(variance)

    # Step 3: Get band energies
    eBreath, eWalk, eRun = calculate_band_energies(rssi)

    # Step 4: Band thresholds
    breath_thresh = (np.mean(eBreath[:BASELINE_N]) +
                     2.0 * np.std(eBreath[:BASELINE_N]))
    walk_thresh   = (np.mean(eWalk[:BASELINE_N])   +
                     2.0 * np.std(eWalk[:BASELINE_N]))
    run_thresh    = (np.mean(eRun[:BASELINE_N])     +
                     2.0 * np.std(eRun[:BASELINE_N]))

    # Step 5: Detect motion at last sample
    last_var     = variance[-1]
    is_motion    = bool(last_var > threshold)

    # Step 6: Classify if motion detected
    activity     = None
    threat_level = 0

    if is_motion:
        activity     = classify_activity(
                            eBreath[-1], eWalk[-1], eRun[-1],
                            breath_thresh, walk_thresh, run_thresh)
        threat_level = get_threat_level(activity)

    return {
        "is_motion"    : is_motion,
        "activity"     : activity,
        "threat_level" : threat_level,
        "variance"     : float(last_var),
        "threshold"    : float(threshold),
        "confidence"   : float(min(100, (last_var/threshold)*50))
                         if is_motion else 0.0
    }