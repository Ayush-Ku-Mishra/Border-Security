import numpy as np
from scipy.signal import butter, filtfilt

FS           = 20
WINDOW_SEC   = 3
WINDOW_SIZE  = WINDOW_SEC * FS
BASELINE_SEC = 10
BASELINE_N   = BASELINE_SEC * FS
K_THRESHOLD  = 1.2


def make_bandpass(low, high, fs=FS):
    b, a = butter(2, [low, high], btype='bandpass', fs=fs)
    return b, a


B_HIDING,   A_HIDING   = make_bandpass(0.10, 0.45)
B_CRAWL,    A_CRAWL    = make_bandpass(0.45, 0.70)
B_WALK,     A_WALK     = make_bandpass(0.80, 1.50)
B_ANIMAL_L, A_ANIMAL_L = make_bandpass(0.70, 1.00)
B_RUN,      A_RUN      = make_bandpass(1.50, 3.00)
B_TRUCK,    A_TRUCK    = make_bandpass(2.50, 3.50)
B_BIKE,     A_BIKE     = make_bandpass(3.50, 5.00)
B_CAR,      A_CAR      = make_bandpass(5.00, 8.00)
B_ANIMAL_S, A_ANIMAL_S = make_bandpass(1.50, 2.20)


def calculate_variance(rssi_array):
    n        = len(rssi_array)
    variance = np.zeros(n)
    for i in range(n):
        start       = max(0, i - WINDOW_SIZE + 1)
        segment     = rssi_array[start:i+1]
        variance[i] = np.var(segment)
    return variance


def calculate_threshold(variance_array):
    baseline      = variance_array[:BASELINE_N]
    baseline_mean = np.mean(baseline)
    baseline_std  = np.std(baseline)
    threshold     = baseline_mean + K_THRESHOLD * baseline_std
    return threshold, baseline_mean, baseline_std


def calculate_band_energy(rssi, b, a, window):
    sig    = filtfilt(b, a, rssi)
    n      = len(rssi)
    energy = np.zeros(n)
    for i in range(n):
        s         = max(0, i - window + 1)
        energy[i] = np.mean(sig[s:i+1] ** 2)
    return energy


def process_rssi(rssi_array):
    rssi      = np.array(rssi_array)
    variance  = calculate_variance(rssi)
    threshold, b_mean, b_std = calculate_threshold(variance)

    last_var  = variance[-1]
    is_motion = bool(last_var > threshold)

    if is_motion:
        # ── Confidence: how much above threshold ──
        # If var = threshold → 50%, if var = 2x threshold → 100%
        ratio      = float(last_var / threshold) if threshold > 0 else 1.0
        confidence = float(min(100.0, max(40.0, ratio * 60.0)))
    else:
        confidence = 0.0

    return {
        "is_motion"  : is_motion,
        "variance"   : float(last_var),
        "threshold"  : float(threshold),
        "confidence" : confidence,
    }